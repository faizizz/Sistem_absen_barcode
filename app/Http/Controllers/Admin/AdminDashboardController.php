<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\DashboardQueryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __construct(private readonly DashboardQueryService $queries)
    {
    }

    public function index(Request $request): Response
    {
        $eventId = $request->query('event_id');

        if ($eventId) {
            $stats = $this->queries->overviewForEvent((int) $eventId);

            $todayEvents = collect()
                ->when(
                    $event = Event::query()->find((int) $eventId),
                    fn ($c) => $c->push(EventResource::brief($event, $this->queries->eventHadirCount($event))),
                )
                ->values();

            $recentAttendances = AttendanceResource::collection(
                $this->queries->recentAttendancesForEvent((int) $eventId),
            );
        } else {
            $stats = $this->queries->overview();

            $todayEvents = $this->queries->todayEvents()
                ->map(fn (Event $event) => EventResource::brief($event, $this->queries->eventHadirCount($event)))
                ->values();

            $recentAttendances = AttendanceResource::collection($this->queries->recentAttendances());
        }

        return Inertia::render('Admin/Dashboard', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'overview' => $stats['overview'],
            'recentAttendances' => $recentAttendances,
            'todayEvents' => $todayEvents,
            'exportableEvents' => Cache::remember(
                'exportable-events',
                300,
                fn () => Event::orderByDesc('tanggal')
                    ->limit(100)
                    ->get(['id', 'nama_kegiatan', 'tanggal'])
                    ->map(fn (Event $event) => [
                        'id' => $event->id,
                        'nama_kegiatan' => $event->nama_kegiatan,
                        'tanggal' => $event->tanggal?->format('Y-m-d'),
                    ])
                    ->values(),
            ),
        ]);
    }
}
