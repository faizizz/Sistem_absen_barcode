<?php

namespace App\Services;

use App\Support\AttendanceWorkbookExporter;

class AttendanceExportService
{
    public function __construct(
        private readonly AttendanceWorkbookExporter $exporter,
        private readonly AuditService $audit,
    ) {
    }

    public function generate(?int $eventId, ?string $from, ?string $to): string
    {
        $path = $this->exporter
            ->withFilters(
                eventId: $eventId,
                from: $from,
                to: $to,
            )
            ->storeTemporaryXlsx();

        $this->audit->record(
            'attendance.export',
            'Mengexport rekap kehadiran',
            null,
            ['event_id' => $eventId, 'from' => $from, 'to' => $to],
        );

        return $path;
    }
}
