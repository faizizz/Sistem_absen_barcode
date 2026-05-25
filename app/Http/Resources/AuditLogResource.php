<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var AuditLog $log */
        $log = $this->resource;

        return [
            'id' => $log->id,
            'action' => $log->action,
            'description' => $log->description,
            'actor' => $log->user?->login_code ?? 'Sistem',
            'ip_address' => $log->ip_address,
            'metadata' => $log->metadata,
            'created_at' => optional($log->created_at)->format('d M Y, H:i:s'),
            'created_at_iso' => optional($log->created_at)->toIso8601String(),
        ];
    }
}
