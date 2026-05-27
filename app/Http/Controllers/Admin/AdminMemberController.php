<?php

namespace App\Http\Controllers\Admin;

use App\DTO\MemberData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMemberRequest;
use App\Http\Requests\Admin\UpdateMemberRequest;
use App\Http\Resources\MemberResource;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Profile;
use App\Services\AuditService;
use App\Services\MemberService;
use App\Services\QrTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminMemberController extends Controller
{
    public function __construct(
        private readonly MemberService $members,
        private readonly QrTokenService $qrTokens,
        private readonly AuditService $audit,
    ) {
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $departmentFilter = $request->string('departemen')->toString();

        $query = Profile::query()->with('user');

        if ($search !== '') {
            $needle = '%'.strtolower($search).'%';
            $query->where(function ($q) use ($needle): void {
                $q->whereRaw('LOWER(nama) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(nim) LIKE ?', [$needle]);
            });
        }

        if (in_array($departmentFilter, Profile::DEPARTMENTS, true)) {
            $query->where('departemen', $departmentFilter);
        }

        $members = $query
            ->orderBy('nama')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Profile $profile) => (new MemberResource($profile))->toArray($request));

        return Inertia::render('Admin/Members/Index', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'members' => $members,
            'departments' => Profile::DEPARTMENTS,
            'filters' => [
                'search' => $search,
                'departemen' => $departmentFilter,
            ],
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

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Members/Form', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'member' => null,
            'departments' => Profile::DEPARTMENTS,
        ]);
    }

    public function store(StoreMemberRequest $request): RedirectResponse
    {
        $this->authorize('create', Profile::class);

        $this->members->create(MemberData::fromArray($request->validated()));

        return to_route('admin.members.index')->with('success', 'Anggota berhasil ditambahkan.');
    }

    public function edit(Request $request, Profile $member): Response
    {
        return Inertia::render('Admin/Members/Form', [
            'admin' => ['login_code' => $request->user()?->login_code],
            'member' => [
                'id' => $member->id,
                'nama' => $member->nama,
                'nim' => $member->nim,
                'departemen' => $member->departemen,
                'jabatan' => $member->jabatan,
            ],
            'departments' => Profile::DEPARTMENTS,
        ]);
    }

    public function update(UpdateMemberRequest $request, Profile $member): RedirectResponse
    {
        $this->members->update($member, MemberData::fromArray($request->validated()));

        return to_route('admin.members.index')->with('success', 'Data anggota berhasil diperbarui.');
    }

    public function destroy(Profile $member): RedirectResponse
    {
        $this->members->delete($member);

        return to_route('admin.members.index')->with('success', 'Anggota berhasil dihapus.');
    }

    public function attendanceHistory(Request $request, Profile $member): JsonResponse
    {
        $attendances = Attendance::query()
            ->with('event')
            ->where('user_id', $member->user_id)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Attendance $attendance) => [
                'id' => $attendance->id,
                'event' => $attendance->event?->nama_kegiatan ?? '—',
                'tanggal' => optional($attendance->event?->tanggal)->format('d M Y'),
                'status' => $attendance->status,
                'check_in_time' => optional($attendance->check_in_time)->format('d M Y, H:i'),
                'alasan' => $attendance->alasan,
            ]);

        $totalEvents = $this->members->totalRelevantEvents();
        $summary = $this->members->attendanceSummary($member->user_id, $totalEvents);

        return response()->json([
            'attendances' => $attendances,
            'summary' => $summary,
        ]);
    }

    /**
     * Activate (issue) a QR token for a member who does not have one yet.
     *
     * Admin-only escape hatch for the one-time public flow: anggota yang
     * belum aktivasi QR (entah belum pernah ke portal, atau ke-reset karena
     * NIM-nya berubah) bisa di-aktivasi langsung dari tab anggota.
     *
     * Strict policy: this never regenerates an existing token. If the
     * profile already has a QR, we return 409 so the admin UI shows
     * "Unduh QR" instead of accidentally invalidating any printed QR
     * already in circulation.
     */
    public function activateQr(Request $request, Profile $member): JsonResponse
    {
        $this->authorize('update', $member);

        if (! blank($member->qr_token)) {
            return response()->json([
                'message' => 'QR untuk anggota ini sudah aktif. Gunakan tombol unduh untuk mengambil QR yang sudah ada.',
                'has_qr' => true,
                'qr_code' => $member->qr_token,
            ], 409);
        }

        $member = $this->qrTokens->issueFor($member);

        $this->audit->record(
            'member.qr_activate',
            "Aktivasi QR untuk anggota '{$member->nama}' (NIM {$member->nim})",
            $member->user,
        );

        return response()->json([
            'message' => 'QR berhasil diaktivasi. Bagikan QR ke anggota.',
            'has_qr' => true,
            'qr_code' => $member->qr_token,
            'nama' => $member->nama,
            'nim' => $member->nim,
        ], 201);
    }

    /**
     * Return the existing QR payload for a member so the admin can preview
     * and re-download it. Does not generate; if the member has no QR yet,
     * the admin must call activateQr first.
     */
    public function showQr(Request $request, Profile $member): JsonResponse
    {
        $this->authorize('view', $member);

        if (blank($member->qr_token)) {
            return response()->json([
                'message' => 'Anggota ini belum memiliki QR aktif. Aktivasi QR dulu untuk mengambil payload.',
                'has_qr' => false,
            ], 404);
        }

        return response()->json([
            'has_qr' => true,
            'qr_code' => $member->qr_token,
            'nama' => $member->nama,
            'nim' => $member->nim,
            'departemen' => $member->departemen,
            'jabatan' => $member->jabatan,
        ]);
    }
}
