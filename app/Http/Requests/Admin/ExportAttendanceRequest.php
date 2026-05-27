<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ExportAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === User::ROLE_ADMIN;
    }

    /**
     * Normalise empty query-string values to null so the `nullable` rule
     * actually short-circuits subsequent rules. Without this, a client that
     * sends `?from=&to=2026-05-28` would have `from = ''`, which makes
     * `after_or_equal:from` compare against an empty string and fail in some
     * Laravel versions even when the user clearly intended "no lower bound".
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'event_id' => $this->filled('event_id') ? $this->input('event_id') : null,
            'from' => $this->filled('from') ? $this->input('from') : null,
            'to' => $this->filled('to') ? $this->input('to') : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Range constraint is enforced here (instead of via `after_or_equal:from`
     * on the `to` field) so it only fires when both ends are provided.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $from = $this->input('from');
            $to = $this->input('to');

            if (! $from || ! $to) {
                return;
            }

            try {
                if (Carbon::parse($to)->lt(Carbon::parse($from))) {
                    $validator->errors()->add(
                        'to',
                        'Tanggal "sampai" harus sama atau setelah tanggal "dari".',
                    );
                }
            } catch (\Throwable) {
                // Format already covered by date_format rule; ignore here.
            }
        });
    }

    public function attributes(): array
    {
        return [
            'event_id' => 'event',
            'from' => 'tanggal mulai',
            'to' => 'tanggal akhir',
        ];
    }
}
