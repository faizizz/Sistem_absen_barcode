<?php

namespace App\Http\Resources;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Event $event */
        $event = $this->resource;

        return [
            'id' => $event->id,
            'nama_kegiatan' => $event->nama_kegiatan,
            'deskripsi' => $event->deskripsi,
            'tanggal_mulai' => optional($event->tanggal_mulai)->format('Y-m-d'),
            'tanggal_selesai' => optional($event->tanggal_selesai)->format('Y-m-d'),
            'tanggal_mulai_label' => optional($event->tanggal_mulai)->translatedFormat('d M Y'),
            'tanggal_selesai_label' => optional($event->tanggal_selesai)->translatedFormat('d M Y'),
            'waktu_mulai' => optional($event->waktu_mulai)->format('H:i'),
            'waktu_selesai' => optional($event->waktu_selesai)->format('H:i'),
            'batas_absensi' => optional($event->batas_absensi)->format('H:i'),
            'departemen' => $event->departemen,
            'status' => $event->status,
            'time_state' => $event->timeState(),
            'is_open_for_scan' => $event->isOpenForScan(),
            'created_by' => $event->creator?->login_code,
            'attendance_count' => $this->whenLoaded('attendances', fn () => $event->attendances->count(), fn () => $event->attendances()->count()),
        ];
    }

    public static function brief(Event $event, ?int $hadirCount = null): array
    {
        return [
            'id' => $event->id,
            'nama_kegiatan' => $event->nama_kegiatan,
            'tanggal_mulai' => optional($event->tanggal_mulai)->format('Y-m-d'),
            'tanggal_selesai' => optional($event->tanggal_selesai)->format('Y-m-d'),
            'tanggal_mulai_label' => optional($event->tanggal_mulai)->translatedFormat('d M Y'),
            'tanggal_selesai_label' => optional($event->tanggal_selesai)->translatedFormat('d M Y'),
            'waktu_mulai' => optional($event->waktu_mulai)->format('H:i'),
            'waktu_selesai' => optional($event->waktu_selesai)->format('H:i'),
            'batas_absensi' => optional($event->batas_absensi)->format('H:i'),
            'departemen' => $event->departemen,
            'status' => $event->status,
            'time_state' => $event->timeState(),
            'is_open_for_scan' => $event->isOpenForScan(),
            'hadir_count' => $hadirCount,
        ];
    }
}
