<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\Auth\AccountLockedException;
use App\Exceptions\Auth\AccountPermanentlyLockedException;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\LoginThrottleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * LoginController — pintu utama otentikasi admin.
 *
 * Alur (lihat .kiro/plans/admin-access-hardening/plan.md, Task 3):
 *   1. Validasi input.
 *   2. assertNotLocked($login_code) — bila terkunci, tampilkan pesan
 *      spesifik (sengaja transparan; admin perlu tahu untuk minta unlock).
 *   3. Auth::attempt — bila gagal, registerFailure (mungkin trigger
 *      lockout/permanent lock), pesan error generik agar tidak bocor
 *      info user enumeration.
 *   4. Cek role admin. Bila bukan admin, logout & pesan generik
 *      (jangan beri tahu bahwa akun itu bukan admin → enumeration).
 *   5. Bila sukses, registerSuccess (reset counter, simpan last_login_*),
 *      regenerate session, redirect ke dashboard.
 *
 * Tambahan throttle:10,5 dipasang di route POST /kuasa untuk lapisan
 * kedua melawan distributed brute-force terhadap banyak login_code.
 */
class LoginController extends Controller
{
    public function __construct(private readonly LoginThrottleService $throttle)
    {
    }

    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'login_code' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginCode = $credentials['login_code'];
        $ip = (string) $request->ip();

        // ── 1. Cek lockout sebelum mencocokkan kredensial ───────────
        try {
            $this->throttle->assertNotLocked($loginCode);
        } catch (AccountPermanentlyLockedException $e) {
            return back()
                ->withErrors(['login_code' => $e->getMessage()])
                ->onlyInput('login_code');
        } catch (AccountLockedException $e) {
            return back()
                ->withErrors(['login_code' => $e->getMessage()])
                ->onlyInput('login_code');
        }

        // ── 2. Coba autentikasi ─────────────────────────────────────
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            $this->throttle->registerFailure($loginCode, $ip, 'invalid_credentials');

            // Catatan: registerFailure bisa men-trigger lockout pada
            // attempt ke-N; kita re-check & sampaikan pesan lockout
            // ke user di response yang sama agar UX tidak membingungkan.
            try {
                $this->throttle->assertNotLocked($loginCode);
            } catch (AccountPermanentlyLockedException $e) {
                return back()
                    ->withErrors(['login_code' => $e->getMessage()])
                    ->onlyInput('login_code');
            } catch (AccountLockedException $e) {
                return back()
                    ->withErrors(['login_code' => $e->getMessage()])
                    ->onlyInput('login_code');
            }

            return back()
                ->withErrors(['login_code' => 'Kode admin atau password salah.'])
                ->onlyInput('login_code');
        }

        /** @var User $user */
        $user = $request->user();

        // ── 3. Pastikan role admin ─────────────────────────────────
        if (! $user->isAdmin()) {
            // Audit dengan info role (untuk forensik) tapi pesan ke
            // user tetap generik agar tidak membocorkan keberadaan akun.
            AuditLog::record(
                'auth.login.role_denied',
                "Login ditolak — akun {$user->login_code} bukan admin",
                $user,
                ['login_code' => $user->login_code, 'role' => $user->role, 'ip' => $ip]
            );

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()
                ->withErrors(['login_code' => 'Kode admin atau password salah.'])
                ->onlyInput('login_code');
        }

        // ── 4. Sukses ──────────────────────────────────────────────
        $this->throttle->registerSuccess($user, $ip);
        $request->session()->regenerate();

        // RequirePasswordChange middleware akan membelokkan ke halaman
        // ganti password jika user->must_change_password=true.
        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user !== null) {
            AuditLog::record(
                'auth.logout',
                "Logout: {$user->login_code}",
                $user,
                ['login_code' => $user->login_code, 'ip' => (string) $request->ip()]
            );
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
