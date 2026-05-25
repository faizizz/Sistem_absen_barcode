<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public function record(
        string $action,
        string $description,
        ?Model $target = null,
        ?array $metadata = null,
    ): AuditLog {
        return AuditLog::record($action, $description, $target, $metadata);
    }

    public function query(array $filters = [])
    {
        $query = AuditLog::query()->with('user');

        if (! empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (! empty($filters['from'])) {
            $query->where('created_at', '>=', $filters['from'].' 00:00:00');
        }

        if (! empty($filters['to'])) {
            $query->where('created_at', '<=', $filters['to'].' 23:59:59');
        }

        return $query->orderByDesc('created_at');
    }

    public function distinctActions()
    {
        return AuditLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');
    }
}
