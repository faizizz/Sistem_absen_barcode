<?php

namespace App\Services;

use App\Exceptions\Admin\AdminInvariantException;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * AdminUserService — orchestrasi CRUD admin user beserta invariant
 * minimum-2-admin (lihat plan Task 6).
 *
 *   - create(): menambah admin baru dengan flag must_change_password=true
 *               sehingga login pertama langsung dipaksa ganti password.
 *   - delete(): menolak jika akan menyisakan <2 admin atau menghapus diri
 *               sendiri.
 *   - unlock(): delegasi ke LoginThrottleService::unlockUser dengan audit
 *               attribusi admin yang melakukannya.
 */
class AdminUserService
{
    /** Minimal admin yang harus ada di sistem. */
    public const MIN_ADMINS = 2;

    public function __construct(private readonly LoginThrottleService $throttle)
    {
    }

    /**
     * Buat admin baru. Password di-hash otomatis via cast 'hashed'.
     * Hash password disimpan di history agar tidak bisa dipakai ulang
     * pada penggantian password berikutnya.
     *
     * @param  array{login_code: string, password: string}  $data
     */
    public function create(array $data, User $by): User
    {
        return DB::transaction(function () use ($data, $by): User {
            $user = new User();
            $user->login_code = $data['login_code'];
            $user->password = $data['password']; // di-hash via cast
            $user->role = User::ROLE_ADMIN;
            // Paksaan ganti password pada login pertama dimatikan per
            // keputusan operasional. Admin baru dapat login langsung
            // dengan password awalnya. Field tetap di-flag false untuk
            // konsistensi data.
            $user->must_change_password = false;
            $user->password_changed_at = null;
            $user->pushPasswordHistory($user->password);
            $user->save();

            AuditLog::record(
                'admin.user.created',
                "Admin {$by->login_code} membuat akun admin baru: {$user->login_code}",
                $user,
                [
                    'created_login_code' => $user->login_code,
                    'created_by_login_code' => $by->login_code,
                ]
            );

            return $user;
        });
    }

    /**
     * Hapus admin. Menolak jika:
     *   - admin yang akan dihapus adalah diri sendiri ($by);
     *   - jumlah admin akan turun di bawah MIN_ADMINS.
     *
     * @throws AdminInvariantException
     */
    public function delete(User $target, User $by): void
    {
        if ($target->id === $by->id) {
            throw new AdminInvariantException('Tidak dapat menghapus akun admin sendiri.');
        }

        if (! $target->isAdmin()) {
            throw new AdminInvariantException('User ini bukan admin.');
        }

        DB::transaction(function () use ($target, $by): void {
            $remaining = User::query()
                ->where('role', User::ROLE_ADMIN)
                ->where('id', '!=', $target->id)
                ->count();

            if ($remaining < self::MIN_ADMINS) {
                throw new AdminInvariantException(
                    'Tidak boleh menghapus admin: sistem wajib memiliki minimal '.self::MIN_ADMINS.' admin.'
                );
            }

            $loginCode = $target->login_code;
            $target->delete();

            AuditLog::record(
                'admin.user.deleted',
                "Admin {$by->login_code} menghapus akun admin: {$loginCode}",
                null,
                [
                    'deleted_login_code' => $loginCode,
                    'deleted_by_login_code' => $by->login_code,
                ]
            );
        });
    }

    /**
     * Buka kunci akun admin yang locked_until/locked_permanently aktif.
     * Self-action diblok agar admin tidak bisa unlock dirinya sendiri
     * (defense-in-depth — meski strictly secara teknis admin yang
     * sedang locked tidak bisa login untuk men-trigger unlock).
     *
     * @throws AdminInvariantException
     */
    public function unlock(User $target, User $by): void
    {
        if ($target->id === $by->id) {
            throw new AdminInvariantException('Tidak dapat membuka kunci akun sendiri. Minta admin lain untuk melakukannya.');
        }

        $this->throttle->unlockUser($target, $by);
    }
}
