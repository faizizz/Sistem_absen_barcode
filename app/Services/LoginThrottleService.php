<?php

namespace App\Services;

use App\Exceptions\Auth\AccountLockedException;
use App\Exceptions\Auth\AccountPermanentlyLockedException;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Pusat pengelolaan state lockout login admin. Semua transisi state
 * (failure increment, lockout trigger, permanent lock, unlock, success)
 * dilakukan di sini agar logika brute-force protection terpusat dan
 * mudah ditest. Setiap transisi penting dicatat di audit log.
 *
 * Aturan:
 *   - 3 percobaan gagal berturut-turut → akun dikunci 30 menit (1 siklus)
 *   - 3 siklus lockout berturut-turut tanpa login sukses → akun dikunci permanen
 *   - Login sukses mereset counter percobaan & counter siklus
 *   - Akun terkunci permanen hanya bisa dibuka via unlockUser() oleh admin lain
 */
class LoginThrottleService
{
    /** Jumlah percobaan gagal sebelum akun dikunci sementara. */
    public const MAX_ATTEMPTS = 3;

    /** Durasi lockout sementara dalam menit. */
    public const LOCKOUT_MINUTES = 30;

    /** Jumlah siklus lockout berturut sebelum akun dikunci permanen. */
    public const MAX_CYCLES_BEFORE_PERMANENT = 3;

    /**
     * Pastikan akun (jika ada) tidak dalam keadaan terkunci. Dipanggil
     * sebelum Auth::attempt agar pesan lockout dapat ditampilkan tanpa
     * harus mencocokkan password terlebih dahulu (UX lebih jelas).
     *
     * Jika login_code tidak terdaftar, method ini diam saja — agar
     * tidak membocorkan apakah user ada atau tidak.
     *
     * @throws AccountPermanentlyLockedException
     * @throws AccountLockedException
     */
    public function assertNotLocked(string $loginCode): void
    {
        $user = User::query()->where('login_code', $loginCode)->first();

        if ($user === null) {
            return;
        }

        if ($user->isPermanentlyLocked()) {
            $this->recordAudit(
                'auth.login.locked_attempt',
                "Percobaan login pada akun terkunci permanen: {$loginCode}",
                $user,
                ['lockout_state' => 'permanent']
            );

            throw new AccountPermanentlyLockedException();
        }

        if ($user->isTemporarilyLocked()) {
            $remaining = $user->lockoutRemainingMinutes();

            $this->recordAudit(
                'auth.login.locked_attempt',
                "Percobaan login pada akun terkunci sementara: {$loginCode}",
                $user,
                [
                    'lockout_state' => 'temporary',
                    'remaining_minutes' => $remaining,
                ]
            );

            throw new AccountLockedException($remaining);
        }
    }

    /**
     * Catat satu kegagalan login untuk login_code tertentu.
     *
     *   - Jika user ada → increment counter; jika mencapai threshold,
     *     trigger lockout sementara atau permanen.
     *   - Jika user tidak ada → cukup catat ke audit log (tanpa state
     *     change di DB) untuk membantu detection. Tidak ada cara untuk
     *     "lock" akun yang tidak ada.
     *
     * @param  string  $reason  Alasan teknis: 'invalid_credentials' | 'role_denied'
     */
    public function registerFailure(string $loginCode, string $ip, string $reason = 'invalid_credentials'): void
    {
        $user = User::query()->where('login_code', $loginCode)->first();

        if ($user === null) {
            $this->recordAudit(
                'auth.login.failed',
                "Login gagal: kode admin tidak dikenal ({$loginCode})",
                null,
                [
                    'login_code' => $loginCode,
                    'ip' => $ip,
                    'reason' => 'unknown_login_code',
                ]
            );

            return;
        }

        DB::transaction(function () use ($user, $loginCode, $ip, $reason): void {
            // Reload dalam transaksi untuk menghindari race condition.
            $fresh = User::query()->lockForUpdate()->find($user->id);
            if ($fresh === null) {
                return;
            }

            $fresh->failed_login_attempts++;

            $this->recordAudit(
                'auth.login.failed',
                "Login gagal untuk {$loginCode} (percobaan ke-{$fresh->failed_login_attempts})",
                $fresh,
                [
                    'login_code' => $loginCode,
                    'ip' => $ip,
                    'reason' => $reason,
                    'attempt' => $fresh->failed_login_attempts,
                ]
            );

            if ($fresh->failed_login_attempts >= self::MAX_ATTEMPTS) {
                $fresh->lockout_cycles++;
                $fresh->failed_login_attempts = 0;

                if ($fresh->lockout_cycles >= self::MAX_CYCLES_BEFORE_PERMANENT) {
                    $fresh->locked_permanently = true;
                    $fresh->locked_until = null;

                    $this->recordAudit(
                        'auth.permanent_lock',
                        "Akun {$loginCode} dikunci permanen setelah {$fresh->lockout_cycles} siklus lockout",
                        $fresh,
                        [
                            'login_code' => $loginCode,
                            'cycles' => $fresh->lockout_cycles,
                        ]
                    );
                } else {
                    $fresh->locked_until = now()->addMinutes(self::LOCKOUT_MINUTES);

                    $this->recordAudit(
                        'auth.lockout_triggered',
                        "Akun {$loginCode} dikunci sementara selama ".self::LOCKOUT_MINUTES.' menit (siklus ke-'.$fresh->lockout_cycles.')',
                        $fresh,
                        [
                            'login_code' => $loginCode,
                            'cycle' => $fresh->lockout_cycles,
                            'locked_until' => $fresh->locked_until->toIso8601String(),
                        ]
                    );
                }
            }

            $fresh->save();
        });
    }

    /**
     * Catat login sukses: reset semua counter brute-force, simpan
     * jejak last_login_*, lalu audit. User di-refresh setelah operasi.
     */
    public function registerSuccess(User $user, string $ip): void
    {
        DB::transaction(function () use ($user, $ip): void {
            $fresh = User::query()->lockForUpdate()->find($user->id);
            if ($fresh === null) {
                return;
            }

            $fresh->failed_login_attempts = 0;
            $fresh->lockout_cycles = 0;
            $fresh->locked_until = null;
            // locked_permanently TIDAK direset di sini — hanya unlockUser()
            // yang boleh menghapus permanent lock.
            $fresh->last_login_at = now();
            $fresh->last_login_ip = $ip;
            $fresh->save();
        });

        $this->recordAudit(
            'auth.login.success',
            "Login berhasil: {$user->login_code}",
            $user->refresh(),
            ['login_code' => $user->login_code, 'ip' => $ip]
        );
    }

    /**
     * Buka kunci akun: reset seluruh state lockout, dipanggil oleh admin
     * lain dari halaman manajemen admin. Dicatat di audit log dengan
     * actor admin yang melakukan unlock.
     */
    public function unlockUser(User $target, User $by): void
    {
        DB::transaction(function () use ($target): void {
            $fresh = User::query()->lockForUpdate()->find($target->id);
            if ($fresh === null) {
                return;
            }

            $fresh->failed_login_attempts = 0;
            $fresh->lockout_cycles = 0;
            $fresh->locked_until = null;
            $fresh->locked_permanently = false;
            $fresh->save();
        });

        $this->recordAudit(
            'auth.admin_unlocked',
            "Admin {$by->login_code} membuka kunci akun {$target->login_code}",
            $target->refresh(),
            [
                'unlocked_login_code' => $target->login_code,
                'unlocked_by_login_code' => $by->login_code,
                'unlocked_by_user_id' => $by->id,
            ]
        );
    }

    /**
     * Bungkus AuditLog::record agar service ini tidak terikat langsung
     * ke implementasi audit, dan agar mudah di-mock di test.
     */
    protected function recordAudit(
        string $action,
        string $description,
        ?User $target = null,
        ?array $metadata = null,
    ): void {
        AuditLog::record($action, $description, $target, $metadata);
    }
}
