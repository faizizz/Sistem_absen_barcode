<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\Admin\AdminInvariantException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Models\User;
use App\Services\AdminUserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AdminUserController — manajemen akun admin (Task 6).
 *
 * Endpoints:
 *   - GET    /kuasa/admins              → index
 *   - POST   /kuasa/admins              → store (buat admin baru)
 *   - DELETE /kuasa/admins/{user}       → destroy
 *   - POST   /kuasa/admins/{user}/unlock → unlock (reset lockout)
 *
 * Hanya user dengan role admin yang boleh mengakses (sudah divalidasi
 * via middleware role:admin di route group). Self-action (delete /
 * unlock terhadap diri sendiri) tetap diblok di service layer
 * (AdminUserService) untuk defense-in-depth.
 */
class AdminUserController extends Controller
{
    public function __construct(private readonly AdminUserService $service)
    {
    }

    public function index(Request $request): Response
    {
        $admins = User::query()
            ->where('role', User::ROLE_ADMIN)
            ->orderBy('login_code')
            ->get()
            ->map(fn (User $u) => $this->toRow($u))
            ->values();

        return Inertia::render('Admin/AdminUsers/Index', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'admins' => $admins,
            'currentUserId' => $request->user()?->id,
            'minAdmins' => AdminUserService::MIN_ADMINS,
        ]);
    }

    public function store(StoreAdminUserRequest $request): RedirectResponse
    {
        /** @var User $by */
        $by = $request->user();

        $this->service->create($request->validated(), $by);

        return to_route('admin.admins.index')
            ->with('success', 'Admin baru berhasil dibuat. Mereka wajib mengganti password pada login pertama.');
    }

    public function destroy(Request $request, User $admin): RedirectResponse
    {
        /** @var User $by */
        $by = $request->user();

        try {
            $this->service->delete($admin, $by);
        } catch (AdminInvariantException $e) {
            return back()->with('error', $e->getMessage());
        }

        return to_route('admin.admins.index')
            ->with('success', 'Akun admin berhasil dihapus.');
    }

    public function unlock(Request $request, User $admin): RedirectResponse
    {
        /** @var User $by */
        $by = $request->user();

        try {
            $this->service->unlock($admin, $by);
        } catch (AdminInvariantException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Akun {$admin->login_code} berhasil dibuka.");
    }

    /**
     * Bentuk row data untuk halaman Index. Termasuk computed status
     * lockout untuk badge UI.
     */
    protected function toRow(User $user): array
    {
        $status = 'active';
        $statusDetail = null;

        if ($user->locked_permanently) {
            $status = 'locked_permanent';
        } elseif ($user->isTemporarilyLocked()) {
            $status = 'locked_temporary';
            $statusDetail = $user->lockoutRemainingMinutes();
        } elseif ($user->must_change_password) {
            $status = 'must_change_password';
        }

        return [
            'id' => $user->id,
            'login_code' => $user->login_code,
            'role' => $user->role,
            'status' => $status,
            'status_detail' => $statusDetail,
            'failed_login_attempts' => (int) $user->failed_login_attempts,
            'lockout_cycles' => (int) $user->lockout_cycles,
            'last_login_at' => optional($user->last_login_at)->format('d M Y, H:i'),
            'last_login_ip' => $user->last_login_ip,
            'created_at' => optional($user->created_at)->format('d M Y'),
        ];
    }
}
