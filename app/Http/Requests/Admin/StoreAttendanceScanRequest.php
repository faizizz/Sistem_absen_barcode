<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_ADMIN;
    }

    public function rules(): array
    {
        return [
            'mode' => ['required', 'in:qr,nim'],
            'qr_code' => ['required_if:mode,qr', 'nullable', 'string'],
            'nim' => ['required_if:mode,nim', 'nullable', 'string', 'regex:/^[0-9]+$/'],
            'event_id' => ['required', 'integer', 'exists:events,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'mode' => 'mode input',
            'qr_code' => 'payload QR Code',
            'nim' => 'NIM',
            'event_id' => 'event',
        ];
    }
}
