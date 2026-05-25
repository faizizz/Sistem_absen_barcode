<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExportAttendanceRequest;
use App\Services\AttendanceExportService;
use App\Services\AttendanceService;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminAttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceExportService $export,
        private readonly AttendanceService $attendance,
    ) {
    }

    public function export(ExportAttendanceRequest $request): BinaryFileResponse
    {
        $data = $request->validated();

        $path = $this->export->generate(
            eventId: ! empty($data['event_id']) ? (int) $data['event_id'] : null,
            from: $data['from'] ?? null,
            to: $data['to'] ?? null,
        );

        $suffix = now()->format('Y-m-d');

        return response()->download(
            $path,
            'rekap-kehadiran-'.$suffix.'.xlsx',
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        )->deleteFileAfterSend(true);
    }

    public function resetToday(): RedirectResponse
    {
        $result = $this->attendance->resetToday();

        $message = $result['deleted'] > 0
            ? "Status kehadiran hari ini berhasil direset. {$result['users']} mahasiswa dan {$result['deleted']} log absensi dihapus."
            : 'Belum ada status kehadiran hari ini yang perlu direset.';

        return to_route('admin.dashboard')->with('success', $message);
    }
}
