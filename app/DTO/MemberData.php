<?php

namespace App\DTO;

final class MemberData
{
    public function __construct(
        public readonly string $nama,
        public readonly string $nim,
        public readonly string $departemen,
        public readonly string $jabatan,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            nama: $data['nama'],
            nim: $data['nim'],
            departemen: $data['departemen'],
            jabatan: $data['jabatan'],
        );
    }

    public function toArray(): array
    {
        return [
            'nama' => $this->nama,
            'nim' => $this->nim,
            'departemen' => $this->departemen,
            'jabatan' => $this->jabatan,
        ];
    }
}
