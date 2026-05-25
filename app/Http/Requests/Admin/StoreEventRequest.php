<?php

namespace App\Http\Requests\Admin;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_ADMIN;
    }

    public function rules(): array
    {
        return [
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'tanggal' => ['required', 'date'],
            'waktu_mulai' => ['required', 'date_format:H:i'],
            'waktu_selesai' => ['required', 'date_format:H:i', 'after:waktu_mulai'],
            'batas_absensi' => ['nullable', 'date_format:H:i'],
            'departemen' => ['nullable', Rule::in(Profile::DEPARTMENTS)],
        ];
    }

    public function attributes(): array
    {
        return [
            'nama_kegiatan' => 'nama kegiatan',
            'waktu_mulai' => 'waktu mulai',
            'waktu_selesai' => 'waktu selesai',
            'batas_absensi' => 'batas absensi',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('waktu_mulai') && ! $this->filled('batas_absensi')) {
            // Default batas = waktu_mulai + 15 menit.
            try {
                $start = \Carbon\Carbon::createFromFormat('H:i', $this->input('waktu_mulai'));
                $this->merge(['batas_absensi' => $start->copy()->addMinutes(15)->format('H:i')]);
            } catch (\Throwable) {
                // ignore; let validator handle invalid time format
            }
        }
    }
}
