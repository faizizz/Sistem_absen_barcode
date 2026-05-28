<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreAdminUserRequest — validasi pembuatan admin baru via UI manajemen
 * admin (POST /kuasa/admins).
 *
 * Aturan login_code: minimal 3 karakter, hanya alfanumerik / underscore /
 * dash, lowercase recommended, harus unik di tabel users.
 *
 * Password divalidasi via StrongPassword rule. login_code disertakan ke
 * rule agar password tidak boleh sama dengan login_code yang sedang
 * dimasukkan, walaupun belum ada user-nya.
 */
class StoreAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'login_code' => [
                'required',
                'string',
                'min:3',
                'max:64',
                'regex:/^[a-zA-Z0-9_\-]+$/',
                Rule::unique('users', 'login_code'),
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                (new StrongPassword())->withLoginCode($this->input('login_code')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'login_code.required' => 'Kode admin wajib diisi.',
            'login_code.min' => 'Kode admin minimal :min karakter.',
            'login_code.max' => 'Kode admin maksimal :max karakter.',
            'login_code.regex' => 'Kode admin hanya boleh mengandung huruf, angka, underscore, dan dash.',
            'login_code.unique' => 'Kode admin sudah dipakai.',
            'password.required' => 'Password wajib diisi.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }

    public function prepareForValidation(): void
    {
        if ($this->has('login_code')) {
            $this->merge([
                'login_code' => trim((string) $this->input('login_code')),
            ]);
        }
    }
}
