<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExportAttendanceRequest;
use App\Services\AttendanceExportService;
use App\Services\AttendanceService;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AdminAttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceExportService $export,
        private readonly AttendanceService $attendance,
    ) {
    }

    /**
     * Generate and stream the attendance workbook.
     *
     * Wraps the workbook build in a try/catch so any infrastructure failure
     * (missing `ext-zip`, unwritable temp dir, malformed data) surfaces as a
     * redirect-back with a flash error rather than a bare 500 page that the
     * user would otherwise see as "download tidak bisa".
     *
     * @return BinaryFileResponse|RedirectResponse
     */
    public function export(ExportAttendanceRequest $request): Response
    {
        $data = $request->validated();

        try {
            $path = $this->export->generate(
                eventId: ! empty($data['event_id']) ? (int) $data['event_id'] : null,
                from: $data['from'] ?? null,
                to: $data['to'] ?? null,
            );
        } catch (\RuntimeException $e) {
            report($e);

            return back()->with(
                'error',
                'Gagal membuat file ekspor: '.$e->getMessage(),
            );
        } catch (Throwable $e) {
            report($e);

            return back()->with(
                'error',
                'Terjadi kesalahan saat membuat ekspor. Silakan coba lagi atau hubungi admin.',
            );
        }

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
