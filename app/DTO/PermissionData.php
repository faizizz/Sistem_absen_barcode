<?php

namespace App\DTO;

final class PermissionData
{
    public function __construct(
        public readonly int $userId,
        public readonly string $status,
        public readonly ?string $alasan,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            userId: (int) $data['user_id'],
            status: $data['status'],
            alasan: $data['alasan'] ?? null,
        );
    }
}
