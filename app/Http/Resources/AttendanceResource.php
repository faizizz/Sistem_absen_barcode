<?php

namespace App\Http\Resources;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Attendance $attendance */
        $attendance = $this->resource;

        return [
            'id' => $attendance->id,
            'event_id' => $attendance->event_id,
            'nama' => $attendance->user?->profile?->nama ?? 'Mahasiswa tidak dikenal',
            'nim' => $attendance->user?->profile?->nim ?? '-',
            'departemen' => $attendance->departemen,
            'jabatan' => $attendance->user?->profile?->jabatan ?? '-',
            'event' => $attendance->event?->nama_kegiatan,
            'status' => $attendance->status,
            'status_label' => ucfirst($attendance->status),
            'check_in_time' => optional($attendance->check_in_time)->format('d M Y, H:i:s'),
            'alasan' => $attendance->alasan,
        ];
    }
}
