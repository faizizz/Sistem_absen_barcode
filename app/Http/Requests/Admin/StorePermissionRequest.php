<?php

namespace App\Http\Requests\Admin;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_ADMIN;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['required', 'in:'.Attendance::STATUS_IZIN.','.Attendance::STATUS_SAKIT],
            'alasan' => ['nullable', 'string', 'max:500'],
        ];
    }
}
