<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Hash;

/**
 * StrongPassword — kebijakan password admin (lihat Task 4 plan).
 *
 * Aturan:
 *   - minimal 12 karakter
 *   - mengandung huruf besar, huruf kecil, angka, dan simbol
 *   - tidak boleh sama dengan login_code (case-insensitive) bila
 *     dilampirkan via constructor / withLoginCode()
 *   - tidak boleh sama dengan password yang ada di password_history
 *     (3 hash terakhir) bila User dilampirkan via constructor /
 *     withUser()
 *
 * Pesan validasi dalam Bahasa Indonesia. Pesan pertama yang gagal akan
 * yang dikembalikan agar UX tidak overwhelming.
 */
class StrongPassword implements ValidationRule
{
    public const MIN_LENGTH = 12;

    public function __construct(
        protected ?User $user = null,
        protected ?string $loginCode = null,
    ) {
    }

    public function withUser(?User $user): self
    {
        $this->user = $user;

        // Jika login_code belum di-set eksplisit, ambil dari user.
        if ($this->loginCode === null && $user !== null) {
            $this->loginCode = $user->login_code;
        }

        return $this;
    }

    public function withLoginCode(?string $loginCode): self
    {
        $this->loginCode = $loginCode;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('Password tidak valid.');

            return;
        }

        if (mb_strlen($value) < self::MIN_LENGTH) {
            $fail('Password minimal '.self::MIN_LENGTH.' karakter.');

            return;
        }

        if (! preg_match('/[A-Z]/', $value)) {
            $fail('Password harus mengandung minimal satu huruf besar.');

            return;
        }

        if (! preg_match('/[a-z]/', $value)) {
            $fail('Password harus mengandung minimal satu huruf kecil.');

            return;
        }

        if (! preg_match('/\d/', $value)) {
            $fail('Password harus mengandung minimal satu angka.');

            return;
        }

        // Simbol = karakter selain alfanumerik dan whitespace.
        if (! preg_match('/[^A-Za-z0-9\s]/', $value)) {
            $fail('Password harus mengandung minimal satu simbol (mis. !@#$%).');

            return;
        }

        if ($this->loginCode !== null && $this->loginCode !== '') {
            if (mb_strtolower($value) === mb_strtolower($this->loginCode)) {
                $fail('Password tidak boleh sama dengan kode admin.');

                return;
            }
        }

        if ($this->user !== null) {
            $history = $this->user->password_history ?? [];
            foreach ($history as $hash) {
                if (! is_string($hash) || $hash === '') {
                    continue;
                }
                if (Hash::check($value, $hash)) {
                    $fail('Password tidak boleh sama dengan '.User::PASSWORD_HISTORY_KEEP.' password sebelumnya.');

                    return;
                }
            }
        }
    }
}
