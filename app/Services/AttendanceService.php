<?php

namespace App\Services;

use App\DTO\PermissionData;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(
        private readonly QrTokenService $qrTokens,
        private readonly AuditService $audit,
    ) {
    }

    /**
     * @return array{attendance: Attendance, message: string}
     *
     * @throws DomainException on invalid scan (HTTP-mappable in controller).
     */
    public function scan(string $code, int $eventId, string $mode = 'qr'): array
    {
        $trimmed = trim($code);

        if ($trimmed === '') {
            $msg = $mode === 'nim'
                ? 'NIM kosong. Masukkan NIM mahasiswa.'
                : 'QR Code kosong. Tidak ada data terbaca dari kode.';
            throw new DomainException($msg, 422);
        }

        $student = $mode === 'nim'
            ? $this->resolveByNim($trimmed)
            : $this->resolveByQrToken($trimmed);

        if (! $student->profile) {
            throw new DomainException('Mahasiswa yang dipindai tidak ditemukan atau belum memiliki profil.', 404);
        }

        /** @var Event $event */
        $event = Event::query()->findOrFail($eventId);

        $this->ensureScannable($event);

        if ($event->departemen !== null && $event->departemen !== $student->profile->departemen) {
            throw new DomainException(
                'QR Code ini tidak bisa digunakan untuk event "'.$event->nama_kegiatan.'". '
                .'Mahasiswa terdaftar di departemen '.$student->profile->departemen
                .', sedangkan event ini hanya untuk departemen '.$event->departemen.'.',
                422,
            );
        }

        $now = now();
        $batas = $event->batas_absensi ?? $event->waktu_mulai;
        $status = Attendance::STATUS_HADIR;

        if ($batas) {
            $batasMoment = $event->tanggal_mulai->copy()->setTimeFromTimeString($batas->format('H:i:s'));
            if ($now->greaterThan($batasMoment)) {
                $status = Attendance::STATUS_TERLAMBAT;
            }
        }

        // Block duplicate scans against an already-active record. Revoked
        // records (status='revoked') do NOT count as occupying the slot,
        // so the same user can be re-scanned for the same event after
        // their previous attendance was revoked.
        $existing = Attendance::query()
            ->where('user_id', $student->getKey())
            ->where('event_id', $event->id)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->latest('check_in_time')
            ->first();

        if ($existing) {
            $time = $existing->check_in_time?->format('H:i:s') ?? '-';
            $statusLabel = ucfirst($existing->status);
            throw new DomainException(
                $student->profile->nama.' (NIM '.$student->profile->nim.') '
                .'sudah tercatat absen di event ini pada pukul '.$time
                .' dengan status '.$statusLabel.'.',
                409,
            );
        }

        try {
            $attendance = Attendance::query()->create([
                'user_id' => $student->getKey(),
                'event_id' => $event->id,
                'check_in_time' => $now,
                'attendance_date' => $now->toDateString(),
                'status' => $status,
                'departemen' => $student->profile->departemen,
            ])->load('user.profile', 'event');
        } catch (QueryException $exception) {
            // The DB unique on (user_id, event_id) has been dropped, but
            // we keep this branch as a safety net for legacy schemas.
            if ($this->isUniqueViolation($exception)) {
                throw new DomainException(
                    $student->profile->nama.' (NIM '.$student->profile->nim.') '
                    .'sudah tercatat absen di event ini.',
                    409,
                );
            }

            throw $exception;
        }

        return [
            'attendance' => $attendance,
            'message' => 'Absensi berhasil dicatat untuk '.$student->profile->nama.'.',
        ];
    }

    private function resolveByQrToken(string $token): User
    {
        if (! $this->qrTokens->isValidTokenFormat($token)) {
            throw new DomainException(
                'Format QR Code tidak dikenali. Pastikan ini QR absensi resmi, bukan QR lain.',
                422,
            );
        }

        $profileExists = Profile::query()->where('qr_token', $token)->exists();
        if (! $profileExists) {
            throw new DomainException(
                'QR Code tidak terdaftar di database. Mahasiswa harus generate QR dulu di portal.',
                404,
            );
        }

        $student = $this->qrTokens->resolveUser($token);

        if (! $student) {
            throw new DomainException(
                'QR Code ini milik akun pengurus, bukan mahasiswa peserta.',
                422,
            );
        }

        return $student;
    }

    private function resolveByNim(string $nim): User
    {
        $profile = Profile::query()
            ->where('nim', $nim)
            ->with('user')
            ->first();

        if (! $profile) {
            throw new DomainException(
                'NIM '.$nim.' tidak terdaftar di database.',
                404,
            );
        }

        // Global rule: NIM-mode scans only succeed for users who already
        // have an activated QR token. This keeps the QR as the single
        // source of truth — admin must aktivasi QR dulu sebelum anggota
        // bisa absen via NIM.
        if (blank($profile->qr_token)) {
            throw new DomainException(
                'Anggota dengan NIM '.$nim.' belum aktivasi QR. '
                .'Hubungi admin untuk aktivasi sebelum bisa absen via NIM.',
                422,
            );
        }

        $student = $profile->user;

        if (! $student) {
            throw new DomainException(
                'NIM '.$nim.' tidak memiliki akun terkait.',
                404,
            );
        }

        if ($student->role !== User::ROLE_USER) {
            throw new DomainException(
                'NIM ini milik akun pengurus, bukan mahasiswa peserta.',
                422,
            );
        }

        return $student;
    }

    public function recordPermission(Event $event, PermissionData $data): Attendance
    {
        $existing = Attendance::query()
            ->where('user_id', $data->userId)
            ->where('event_id', $event->id)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->first();

        if ($existing) {
            throw new DomainException('Anggota ini sudah memiliki record absensi pada event ini.', 422);
        }

        $user = User::with('profile')->findOrFail($data->userId);

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'check_in_time' => now(),
            'attendance_date' => $event->tanggal_mulai,
            'status' => $data->status,
            'departemen' => $user->profile?->departemen ?? $event->departemen,
            'alasan' => $data->alasan,
        ]);

        $this->audit->record(
            'attendance.permission',
            "Mencatat {$data->status} untuk {$user->profile?->nama} pada event '{$event->nama_kegiatan}'",
            $event,
            ['user_id' => $user->id, 'status' => $data->status],
        );

        return $attendance;
    }

    /**
     * Revoke (cancel) an existing attendance record.
     *
     * Constraint C1: revoke is allowed regardless of event status (active,
     * closed, or draft) — accountability comes from the audit log instead.
     *
     * Strategy B3: the row is NOT deleted. Instead, status flips to
     * STATUS_REVOKED and the reason is captured in audit-log metadata.
     * The record stays visible in reports but no longer counts as
     * "active", which means the same user can be re-recorded for the
     * same event afterwards (the (user_id, event_id) DB unique was
     * relaxed for exactly this case).
     *
     * @throws DomainException When the attendance is already revoked.
     */
    public function revoke(Attendance $attendance, string $reason, User $admin): Attendance
    {
        if ($attendance->status === Attendance::STATUS_REVOKED) {
            throw new DomainException(
                'Absensi ini sudah pernah di-revoke sebelumnya.',
                422,
            );
        }

        $previousStatus = $attendance->status;

        $attendance->forceFill(['status' => Attendance::STATUS_REVOKED])->save();
        $attendance->refresh()->load('user.profile', 'event');

        $name = $attendance->user?->profile?->nama ?? 'Anggota tidak dikenal';
        $eventLabel = $attendance->event?->nama_kegiatan ?? 'event tidak dikenal';

        $this->audit->record(
            'attendance.revoke',
            "Revoke absensi {$name} (status sebelumnya: {$previousStatus}) "
                ."pada event '{$eventLabel}'. Alasan: {$reason}",
            $attendance,
            [
                'attendance_id' => $attendance->id,
                'user_id' => $attendance->user_id,
                'event_id' => $attendance->event_id,
                'previous_status' => $previousStatus,
                'reason' => $reason,
                'revoked_by' => $admin->id,
            ],
        );

        return $attendance;
    }

    public function markAlpha(Event $event): int
    {
        if ($event->status !== Event::STATUS_CLOSED) {
            throw new DomainException('Tandai alpha hanya bisa dilakukan pada event yang sudah ditutup.', 422);
        }

        // Only consider users who already have an "active" attendance —
        // revoked records do not count, so a user whose attendance was
        // revoked but never re-recorded will correctly get marked alpha.
        $occupiedUserIds = Attendance::query()
            ->where('event_id', $event->id)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->pluck('user_id');

        $memberQuery = Profile::query();
        if ($event->departemen) {
            $memberQuery->where('departemen', $event->departemen);
        }

        $created = 0;
        DB::transaction(function () use ($memberQuery, $event, $occupiedUserIds, &$created): void {
            $memberQuery->whereNotIn('user_id', $occupiedUserIds)
                ->orderBy('id')
                ->lazyById()
                ->each(function (Profile $profile) use ($event, &$created): void {
                    Attendance::create([
                        'user_id' => $profile->user_id,
                        'event_id' => $event->id,
                        'check_in_time' => $event->tanggal_mulai->copy()->setTimeFromTimeString(
                            ($event->waktu_selesai ?? Carbon::now())->format('H:i:s'),
                        ),
                        'attendance_date' => $event->tanggal_mulai,
                        'status' => Attendance::STATUS_ALPHA,
                        'departemen' => $profile->departemen,
                    ]);
                    $created++;
                });
        });

        $this->audit->record(
            'attendance.mark_alpha',
            "Menandai {$created} anggota alpha pada event '{$event->nama_kegiatan}'",
            $event,
            ['count' => $created],
        );

        return $created;
    }

    /**
     * @return array{deleted: int, users: int}
     */
    public function resetToday(): array
    {
        $todayAttendances = Attendance::query()->whereDate('check_in_time', today());
        $users = (clone $todayAttendances)->distinct()->count('user_id');
        $deleted = $todayAttendances->delete();

        $this->audit->record(
            'attendance.reset',
            "Reset absensi hari ini ({$deleted} log, {$users} mahasiswa)",
        );

        return ['deleted' => $deleted, 'users' => $users];
    }

    public function todayOverview(): array
    {
        $today = today();

        return [
            'present_today' => Attendance::query()
                ->whereDate('check_in_time', $today)
                ->whereIn('status', Attendance::ACTIVE_STATUSES)
                ->distinct()
                ->count('user_id'),
            'attendance_logs_today' => Attendance::query()
                ->whereDate('check_in_time', $today)
                ->whereIn('status', Attendance::ACTIVE_STATUSES)
                ->count(),
            'departments_active_today' => Attendance::query()
                ->whereDate('check_in_time', $today)
                ->whereIn('status', Attendance::ACTIVE_STATUSES)
                ->distinct()
                ->count('departemen'),
        ];
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        return (int) ($exception->errorInfo[1] ?? 0) === 1062
            || $exception->getCode() === '23000';
    }

    /**
     * Reject scans for events that are not currently open. Status is the
     * primary signal but we also enforce wall-clock guards so a stale
     * "active" record cannot accept scans after the end time.
     */
    private function ensureScannable(Event $event): void
    {
        $now = now();
        $start = $event->startMoment();
        $end = $event->endMoment();

        switch ($event->status) {
            case Event::STATUS_CLOSED:
                throw new DomainException(
                    'Event "'.$event->nama_kegiatan.'" sudah ditutup. Tidak bisa absen lagi.',
                    422,
                );

            case Event::STATUS_DRAFT:
                if ($end && $now->greaterThan($end)) {
                    throw new DomainException(
                        'Event "'.$event->nama_kegiatan.'" sudah berakhir tanpa diaktifkan.',
                        422,
                    );
                }

                if ($start) {
                    throw new DomainException(
                        'Event "'.$event->nama_kegiatan.'" belum dimulai. Buka pukul '
                        .$start->format('H:i').'.',
                        422,
                    );
                }

                throw new DomainException(
                    'Event "'.$event->nama_kegiatan.'" belum aktif.',
                    422,
                );

            case Event::STATUS_ACTIVE:
                if ($end && $now->greaterThan($end)) {
                    throw new DomainException(
                        'Event "'.$event->nama_kegiatan.'" sudah berakhir pada pukul '
                        .$end->format('H:i').'.',
                        422,
                    );
                }

                return;

            default:
                throw new DomainException('Status event tidak dikenali.', 422);
        }
    }
}
