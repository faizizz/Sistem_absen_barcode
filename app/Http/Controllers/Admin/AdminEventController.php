<?php

namespace App\Http\Controllers\Admin;

use App\DTO\EventData;
use App\DTO\PermissionData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RevokeAttendanceRequest;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Requests\Admin\StorePermissionRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Profile;
use App\Services\AttendanceService;
use App\Services\EventLifecycleService;
use App\Services\EventService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminEventController extends Controller
{
    public function __construct(
        private readonly EventService $events,
        private readonly AttendanceService $attendance,
        private readonly EventLifecycleService $lifecycle,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->lifecycle->syncIfStale();

        $statusFilter = $request->string('status')->lower()->toString();

        $query = Event::query()->with('creator');

        if (in_array($statusFilter, Event::STATUSES, true)) {
            $query->where('status', $statusFilter);
        }

        $events = $query
            ->orderByDesc('tanggal_mulai')
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Event $event) => (new EventResource($event))->toArray($request));

        return Inertia::render('Admin/Events/Index', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'events' => $events,
            'filters' => ['status' => $statusFilter],
            'statuses' => Event::STATUSES,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Events/Form', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'event' => null,
            'departments' => Profile::DEPARTMENTS,
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        $this->authorize('create', Event::class);

        $this->events->create(
            EventData::fromArray($request->validated()),
            (int) $request->user()->id,
        );

        return to_route('admin.events.index')->with('success', 'Event berhasil dibuat.');
    }

    public function edit(Request $request, Event $event): Response
    {
        $this->authorize('update', $event);

        return Inertia::render('Admin/Events/Form', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'event' => (new EventResource($event))->toArray($request),
            'departments' => Profile::DEPARTMENTS,
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        try {
            $this->events->update($event, EventData::fromArray($request->validated()));
        } catch (DomainException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return to_route('admin.events.index')->with('success', 'Event berhasil diperbarui.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        try {
            $this->events->delete($event);
        } catch (DomainException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return to_route('admin.events.index')->with('success', 'Event berhasil dihapus.');
    }

    public function activate(Event $event): RedirectResponse
    {
        try {
            $this->events->activate($event);
        } catch (DomainException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', "Event '{$event->nama_kegiatan}' diaktifkan.");
    }

    public function close(Event $event): RedirectResponse
    {
        try {
            $this->events->close($event);
        } catch (DomainException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', "Event '{$event->nama_kegiatan}' ditutup.");
    }

    public function show(Request $request, Event $event): Response
    {
        $this->lifecycle->syncIfStale();
        $event->refresh();

        $event->load('creator');

        $search = $request->string('search')->trim()->toString();
        $statusFilter = $request->string('status')->lower()->toString();
        $departmentFilter = $request->string('departemen')->toString();

        $allowedStatuses = array_merge(['all', 'belum'], Attendance::ACTIVE_STATUSES);
        if (! in_array($statusFilter, $allowedStatuses, true)) {
            $statusFilter = 'all';
        }

        if ($event->departemen || ! in_array($departmentFilter, Profile::DEPARTMENTS, true)) {
            $departmentFilter = '';
        }

        // Keep one current active attendance per user for the roster and
        // summary, while counting revoked rows separately for audit context.
        $activeByUser = Attendance::query()
            ->where('event_id', $event->id)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->orderByDesc('check_in_time')
            ->get()
            ->unique('user_id')
            ->keyBy('user_id');

        $revokedCount = Attendance::query()
            ->where('event_id', $event->id)
            ->where('status', Attendance::STATUS_REVOKED)
            ->count();

        $baseMemberQuery = Profile::query()->with('user');
        if ($event->departemen) {
            $baseMemberQuery->where('departemen', $event->departemen);
        }

        $totalMembers = (clone $baseMemberQuery)->count();
        $departments = (clone $baseMemberQuery)
            ->whereNotNull('departemen')
            ->distinct()
            ->orderBy('departemen')
            ->pluck('departemen')
            ->values();

        $memberQuery = clone $baseMemberQuery;

        if ($search !== '') {
            $needle = '%'.strtolower($search).'%';
            $memberQuery->where(function ($q) use ($needle): void {
                $q->whereRaw('LOWER(nama) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(nim) LIKE ?', [$needle]);
            });
        }

        if ($departmentFilter !== '') {
            $memberQuery->where('departemen', $departmentFilter);
        }

        if ($statusFilter === 'belum') {
            $memberQuery->whereNotIn('user_id', $activeByUser->keys()->all());
        } elseif ($statusFilter !== 'all') {
            $memberQuery->whereIn(
                'user_id',
                $activeByUser
                    ->filter(fn (Attendance $attendance) => $attendance->status === $statusFilter)
                    ->keys()
                    ->all(),
            );
        }

        $members = $memberQuery
            ->orderBy('nama')
            ->paginate(50)
            ->withQueryString()
            ->through(function (Profile $profile) use ($activeByUser) {
                $attendance = $activeByUser->get($profile->user_id);

                return [
                    'user_id' => $profile->user_id,
                    'nama' => $profile->nama,
                    'nim' => $profile->nim,
                    'departemen' => $profile->departemen,
                    'departemen_kode' => Profile::shortCodeFor($profile->departemen),
                    'jabatan' => $profile->jabatan,
                    'has_qr' => ! blank($profile->qr_token),
                    'attendance' => $attendance ? [
                        'id' => $attendance->id,
                        'status' => $attendance->status,
                        'alasan' => $attendance->alasan,
                        'check_in_time' => optional($attendance->check_in_time)->format('d M Y, H:i'),
                    ] : null,
                ];
            });

        $summary = [
            'hadir' => $activeByUser->where('status', Attendance::STATUS_HADIR)->count(),
            'terlambat' => $activeByUser->where('status', Attendance::STATUS_TERLAMBAT)->count(),
            'izin' => $activeByUser->where('status', Attendance::STATUS_IZIN)->count(),
            'sakit' => $activeByUser->where('status', Attendance::STATUS_SAKIT)->count(),
            'alpha' => $activeByUser->where('status', Attendance::STATUS_ALPHA)->count(),
            'belum' => max($totalMembers - $activeByUser->count(), 0),
            'revoked' => $revokedCount,
            'total_members' => $totalMembers,
        ];

        return Inertia::render('Admin/Events/Show', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'event' => (new EventResource($event))->toArray($request),
            'members' => $members,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'departemen' => $departmentFilter,
            ],
            'departments' => $departments,
            'summary' => $summary,
        ]);
    }

    public function storePermission(StorePermissionRequest $request, Event $event): RedirectResponse
    {
        try {
            $this->attendance->recordPermission($event, PermissionData::fromArray($request->validated()));
        } catch (DomainException $e) {
            return back()->withErrors(['user_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Izin/sakit berhasil dicatat.');
    }

    public function markAlpha(Event $event): RedirectResponse
    {
        try {
            $created = $this->attendance->markAlpha($event);
        } catch (DomainException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', "Berhasil menandai {$created} anggota sebagai alpha.");
    }

    /**
     * Revoke (cancel) an attendance record. The attendance row stays in
     * the table with status='revoked' and the reason is captured in the
     * audit log via AttendanceService::revoke().
     */
    public function revokeAttendance(
        RevokeAttendanceRequest $request,
        Event $event,
        Attendance $attendance,
    ): RedirectResponse {
        // Sanity check: the attendance must belong to the event in the URL.
        // Without this guard a hostile request could revoke another event's
        // attendance just by tampering with the {attendance} segment.
        if ($attendance->event_id !== $event->id) {
            return back()->withErrors(['attendance' => 'Absensi tidak terkait dengan event ini.']);
        }

        try {
            $this->attendance->revoke(
                $attendance,
                $request->validated('reason'),
                $request->user(),
            );
        } catch (DomainException $e) {
            return back()->withErrors(['attendance' => $e->getMessage()]);
        }

        return back()->with('success', 'Absensi berhasil di-revoke.');
    }
}
