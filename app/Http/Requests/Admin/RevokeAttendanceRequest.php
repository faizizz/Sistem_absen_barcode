<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RevokeAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_ADMIN;
    }

    public function rules(): array
    {
        return [
            // Reason is mandatory (R2): admin must explain why the attendance
            // is being revoked. The string is stored in audit-log metadata
            // for accountability, not on the attendance record itself.
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function attributes(): array
    {
        return [
            'reason' => 'alasan revoke',
        ];
    }
}
