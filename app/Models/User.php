<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_USER = 'user';

    /**
     * Berapa banyak hash password yang disimpan di history untuk
     * mencegah reuse. Disinkronkan dengan App\Rules\StrongPassword.
     */
    public const PASSWORD_HISTORY_KEEP = 3;

    protected $fillable = [
        'login_code',
        'password',
        'role',
        'failed_login_attempts',
        'locked_until',
        'locked_permanently',
        'lockout_cycles',
        'must_change_password',
        'password_changed_at',
        'password_history',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'password_history',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
            'locked_permanently' => 'boolean',
            'lockout_cycles' => 'integer',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
            'password_history' => 'array',
            'last_login_at' => 'datetime',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Apakah akun saat ini sedang dikunci sementara (belum kadaluarsa).
     */
    public function isTemporarilyLocked(): bool
    {
        return $this->locked_until !== null
            && $this->locked_until->isFuture();
    }

    /**
     * Apakah akun terkunci permanen — hanya bisa di-unlock oleh admin lain.
     */
    public function isPermanentlyLocked(): bool
    {
        return (bool) $this->locked_permanently;
    }

    /**
     * Sisa menit lockout sementara, dibulatkan ke atas. 0 jika tidak terkunci.
     */
    public function lockoutRemainingMinutes(): int
    {
        if (! $this->isTemporarilyLocked()) {
            return 0;
        }

        $diff = Carbon::now()->diffInSeconds($this->locked_until, false);

        return $diff > 0 ? (int) ceil($diff / 60) : 0;
    }

    /**
     * Push hash password baru ke history & shift agar maksimal
     * PASSWORD_HISTORY_KEEP entry tersimpan. Perubahan harus disimpan
     * via save() oleh pemanggil.
     */
    public function pushPasswordHistory(string $newHash): void
    {
        $history = $this->password_history ?? [];

        // Tambah hash terbaru di awal supaya entry pertama selalu yang
        // paling baru. Trim ke ukuran maksimum.
        array_unshift($history, $newHash);
        $history = array_slice($history, 0, self::PASSWORD_HISTORY_KEEP);

        $this->password_history = $history;
    }

    /**
     * Scope: hanya user dengan role admin.
     */
    public function scopeAdmins(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_ADMIN);
    }
}
