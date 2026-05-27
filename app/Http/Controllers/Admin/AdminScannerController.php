<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAttendanceScanRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\EventResource;
use App\Models\Attendance;
use App\Models\Event;
use App\Services\AttendanceService;
use App\Services\EventLifecycleService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminScannerController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendance,
        private readonly EventLifecycleService $lifecycle,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->lifecycle->syncIfStale();

        $today = today();

        $activeEvents = Event::query()
            ->whereIn('status', [Event::STATUS_DRAFT, Event::STATUS_ACTIVE])
            ->whereDate('tanggal_mulai', '<=', $today)
            ->whereDate('tanggal_selesai', '>=', $today)
            ->orderBy('waktu_mulai')
            ->get()
            ->map(fn (Event $event) => EventResource::brief($event))
            ->values();

        $recentAttendances = Attendance::query()
            ->with('user.profile', 'event')
            ->whereDate('check_in_time', $today)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->latest('check_in_time')
            ->take(12)
            ->get();

        return Inertia::render('Admin/Scanner', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'todayOverview' => $this->attendance->todayOverview(),
            'activeEvents' => $activeEvents,
            'recentAttendances' => AttendanceResource::collection($recentAttendances),
        ]);
    }

    public function store(StoreAttendanceScanRequest $request): JsonResponse
    {
        // Cheap throttled sync so a draft whose start time just arrived
        // can flip to active before we evaluate the scan guard.
        $this->lifecycle->syncIfStale();

        try {
            $mode = $request->validated('mode');
            $code = $mode === 'nim'
                ? (string) $request->validated('nim')
                : (string) $request->validated('qr_code');

            $result = $this->attendance->scan(
                $code,
                (int) $request->validated('event_id'),
                $mode,
            );
        } catch (DomainException $e) {
            $status = $e->getCode() >= 400 ? $e->getCode() : 422;

            return response()->json(['message' => $e->getMessage()], $status);
        }

        return response()->json([
            'message' => $result['message'],
            'attendance' => (new AttendanceResource($result['attendance']))->toArray($request),
            'todayOverview' => $this->attendance->todayOverview(),
        ], 201);
    }
}
