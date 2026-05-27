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
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'waktu_mulai' => ['required', 'date_format:H:i'],
            'waktu_selesai' => ['required', 'date_format:H:i'],
            'batas_absensi' => ['nullable', 'date_format:H:i'],
            'departemen' => ['nullable', Rule::in(Profile::DEPARTMENTS)],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function ($validator): void {
            // Skip kalau field dasar belum lolos validasi.
            if ($validator->errors()->hasAny([
                'tanggal_mulai',
                'tanggal_selesai',
                'waktu_mulai',
                'waktu_selesai',
            ])) {
                return;
            }

            try {
                $start = \Carbon\Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $this->input('tanggal_mulai').' '.$this->input('waktu_mulai'),
                );
                $end = \Carbon\Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $this->input('tanggal_selesai').' '.$this->input('waktu_selesai'),
                );
            } catch (\Throwable) {
                return; // biarkan rule format menangani error parsing.
            }

            // Momen selesai harus benar-benar setelah momen mulai.
            // Pada hari yang sama → waktu_selesai harus > waktu_mulai.
            // Pada hari berbeda → waktu_selesai bebas (karena tanggal sudah maju).
            if ($end->lessThanOrEqualTo($start)) {
                $validator->errors()->add(
                    'waktu_selesai',
                    'Waktu selesai harus setelah waktu mulai.',
                );
            }
        });
    }

    public function attributes(): array
    {
        return [
            'nama_kegiatan' => 'nama kegiatan',
            'tanggal_mulai' => 'tanggal mulai',
            'tanggal_selesai' => 'tanggal selesai',
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
