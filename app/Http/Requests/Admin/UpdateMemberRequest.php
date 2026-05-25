<?php

namespace App\Http\Requests\Admin;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_ADMIN;
    }

    public function rules(): array
    {
        $memberId = $this->route('member')?->id;

        return [
            'nama' => ['required', 'string', 'max:255'],
            'nim' => ['required', 'string', 'max:50', Rule::unique('profiles', 'nim')->ignore($memberId)],
            'departemen' => ['required', Rule::in(Profile::DEPARTMENTS)],
            'jabatan' => ['required', 'string', 'max:255'],
        ];
    }
}
