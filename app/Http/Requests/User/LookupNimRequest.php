<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class LookupNimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nim' => ['bail', 'required', 'string', 'max:50'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nim' => 'NIM',
        ];
    }
}
