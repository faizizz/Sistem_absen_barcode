<?php

use App\Http\Controllers\Admin\AdminAttendanceController;
use App\Http\Controllers\Admin\AdminAuditLogController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminEventController;
use App\Http\Controllers\Admin\AdminMemberController;
use App\Http\Controllers\Admin\AdminScannerController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\User\UserDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', [UserDashboardController::class, 'index'])->name('home');
Route::post('/lookup-nim', [UserDashboardController::class, 'lookupNim'])
    ->middleware('throttle:5,1')
    ->name('lookup-nim');
Route::post('/generate-qr', [UserDashboardController::class, 'generateQr'])
    ->middleware('throttle:5,1')
    ->name('generate-qr');

Route::middleware('guest')->group(function (): void {
    Route::get('/kuasa', [LoginController::class, 'create'])->name('login');
    // throttle:10,5 = 10 percobaan per 5 menit per IP. Lapisan kedua
    // di luar lockout per-akun agar attacker tidak bisa enumerate
    // login_code lewat banyak akun berbeda.
    Route::post('/kuasa', [LoginController::class, 'store'])
        ->middleware('throttle:10,5');
});

Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

Route::middleware(['auth', 'role:admin'])->prefix('kuasa')->group(function (): void {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    Route::get('/scanner', [AdminScannerController::class, 'index'])->name('admin.scanner');
    Route::post('/attendances/scan', [AdminScannerController::class, 'store'])
        ->name('admin.attendances.scan');
    Route::post('/attendances/scan/preview', [AdminScannerController::class, 'preview'])
        ->name('admin.attendances.scan.preview');

    Route::get('/attendances/export', [AdminAttendanceController::class, 'export'])
        ->name('admin.attendances.export');
    Route::post('/attendances/reset', [AdminAttendanceController::class, 'resetToday'])
        ->name('admin.attendances.reset');

    Route::resource('events', AdminEventController::class)->names('admin.events');
    Route::post('events/{event}/activate', [AdminEventController::class, 'activate'])
        ->name('admin.events.activate');
    Route::post('events/{event}/close', [AdminEventController::class, 'close'])
        ->name('admin.events.close');
    Route::post('events/{event}/permission', [AdminEventController::class, 'storePermission'])
        ->name('admin.events.permission');
    Route::post('events/{event}/mark-alpha', [AdminEventController::class, 'markAlpha'])
        ->name('admin.events.mark-alpha');
    Route::post('events/{event}/attendances/{attendance}/revoke', [AdminEventController::class, 'revokeAttendance'])
        ->name('admin.events.attendances.revoke');

    Route::resource('members', AdminMemberController::class)->except(['show'])->names('admin.members');
    Route::get('members/{member}/attendance-history', [AdminMemberController::class, 'attendanceHistory'])
        ->name('admin.members.attendance-history');
    Route::post('members/{member}/qr/activate', [AdminMemberController::class, 'activateQr'])
        ->name('admin.members.qr.activate');
    Route::get('members/{member}/qr', [AdminMemberController::class, 'showQr'])
        ->name('admin.members.qr.show');

    Route::get('audit-logs', [AdminAuditLogController::class, 'index'])->name('admin.audit-logs');

    // Manajemen admin (CRUD + unlock).
    Route::get('admins', [AdminUserController::class, 'index'])->name('admin.admins.index');
    Route::post('admins', [AdminUserController::class, 'store'])->name('admin.admins.store');
    Route::delete('admins/{admin}', [AdminUserController::class, 'destroy'])
        ->whereNumber('admin')
        ->name('admin.admins.destroy');
    Route::post('admins/{admin}/unlock', [AdminUserController::class, 'unlock'])
        ->whereNumber('admin')
        ->name('admin.admins.unlock');
});
