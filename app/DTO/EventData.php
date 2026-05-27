<?php

namespace App\DTO;

final class EventData
{
    public function __construct(
        public readonly string $namaKegiatan,
        public readonly ?string $deskripsi,
        public readonly string $tanggalMulai,
        public readonly string $tanggalSelesai,
        public readonly string $waktuMulai,
        public readonly string $waktuSelesai,
        public readonly ?string $batasAbsensi,
        public readonly ?string $departemen,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            namaKegiatan: $data['nama_kegiatan'],
            deskripsi: $data['deskripsi'] ?? null,
            tanggalMulai: $data['tanggal_mulai'],
            tanggalSelesai: $data['tanggal_selesai'],
            waktuMulai: $data['waktu_mulai'],
            waktuSelesai: $data['waktu_selesai'],
            batasAbsensi: $data['batas_absensi'] ?? null,
            departemen: $data['departemen'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'nama_kegiatan' => $this->namaKegiatan,
            'deskripsi' => $this->deskripsi,
            'tanggal_mulai' => $this->tanggalMulai,
            'tanggal_selesai' => $this->tanggalSelesai,
            'waktu_mulai' => $this->waktuMulai,
            'waktu_selesai' => $this->waktuSelesai,
            'batas_absensi' => $this->batasAbsensi,
            'departemen' => $this->departemen,
        ];
    }
}
