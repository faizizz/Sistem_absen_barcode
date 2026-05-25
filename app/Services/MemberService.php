<?php

namespace App\Services;

use App\DTO\MemberData;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MemberService
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function create(MemberData $data): Profile
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'password' => Hash::make(Str::random(20)),
                'role' => User::ROLE_USER,
            ]);

            $profile = Profile::create([
                'user_id' => $user->id,
                'nama' => $data->nama,
                'nim' => $data->nim,
                'departemen' => $data->departemen,
                'jabatan' => $data->jabatan,
            ]);

            $this->audit->record(
                'member.create',
                "Menambah anggota '{$data->nama}' (NIM {$data->nim})",
                $user,
            );

            return $profile;
        });
    }

    public function update(Profile $profile, MemberData $data): Profile
    {
        $nimChanged = $profile->nim !== $data->nim;

        $profile->fill($data->toArray());
        if ($nimChanged) {
            $profile->qr_token = null;
        }
        $profile->save();

        $this->audit->record(
            'member.update',
            "Mengubah data anggota '{$profile->nama}' (NIM {$profile->nim})",
            $profile->user,
        );

        return $profile;
    }

    public function delete(Profile $profile): void
    {
        $name = $profile->nama;
        $nim = $profile->nim;

        DB::transaction(function () use ($profile): void {
            $profile->user?->delete();
            $profile->delete();
        });

        $this->audit->record('member.delete', "Menghapus anggota '{$name}' (NIM {$nim})");
    }

    public function attendanceSummary(int $userId, int $totalEvents): array
    {
        $hadirCount = Attendance::query()
            ->where('user_id', $userId)
            ->whereIn('status', [Attendance::STATUS_HADIR, Attendance::STATUS_TERLAMBAT])
            ->count();

        $byStatus = Attendance::query()
            ->where('user_id', $userId)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $percentage = $totalEvents > 0
            ? round(($hadirCount / $totalEvents) * 100, 1)
            : 0;

        return [
            'total_events' => $totalEvents,
            'hadir' => (int) ($byStatus[Attendance::STATUS_HADIR] ?? 0),
            'terlambat' => (int) ($byStatus[Attendance::STATUS_TERLAMBAT] ?? 0),
            'izin' => (int) ($byStatus[Attendance::STATUS_IZIN] ?? 0),
            'sakit' => (int) ($byStatus[Attendance::STATUS_SAKIT] ?? 0),
            'alpha' => (int) ($byStatus[Attendance::STATUS_ALPHA] ?? 0),
            'percentage' => $percentage,
        ];
    }

    public function totalRelevantEvents(): int
    {
        return Event::query()
            ->whereIn('status', [Event::STATUS_ACTIVE, Event::STATUS_CLOSED])
            ->count();
    }
}
