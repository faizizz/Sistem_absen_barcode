<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Event;
use App\Models\Profile;

class DashboardQueryService
{
    public function overview(): array
    {
        $today = today();
        $totalStudents = Profile::query()->count();
        $presentToday = Attendance::query()
            ->whereDate('check_in_time', $today)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->distinct()
            ->count('user_id');
        $absentToday = max($totalStudents - $presentToday, 0);
        $attendanceRate = $totalStudents > 0
            ? round(($presentToday / $totalStudents) * 100, 1)
            : 0;

        return [
            'overview' => [
                'date_label' => now()->format('d M Y'),
                'total_students' => $totalStudents,
                'present_today' => $presentToday,
                'absent_today' => $absentToday,
                'attendance_rate' => $attendanceRate,
            ],
        ];
    }

    public function todayEvents()
    {
        return Event::query()
            ->whereDate('tanggal', today())
            ->orderBy('waktu_mulai')
            ->get();
    }

    public function recentAttendances(int $take = 8)
    {
        return Attendance::query()
            ->with('user.profile', 'event')
            ->whereDate('check_in_time', today())
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->latest('check_in_time')
            ->take($take)
            ->get();
    }

    public function overviewForEvent(int $eventId): array
    {
        $event = Event::query()->findOrFail($eventId);
        $profileQuery = Profile::query();
        if ($event->departemen) {
            $profileQuery->where('departemen', $event->departemen);
        }
        $totalStudents = $profileQuery->count();
        $presentToday = $this->eventHadirCount($event);
        $absentToday = max($totalStudents - $presentToday, 0);
        $attendanceRate = $totalStudents > 0
            ? round(($presentToday / $totalStudents) * 100, 1)
            : 0;

        return [
            'overview' => [
                'date_label' => now()->format('d M Y'),
                'total_students' => $totalStudents,
                'present_today' => $presentToday,
                'absent_today' => $absentToday,
                'attendance_rate' => $attendanceRate,
            ],
        ];
    }

    public function recentAttendancesForEvent(int $eventId, int $take = 8)
    {
        return Attendance::query()
            ->with('user.profile', 'event')
            ->where('event_id', $eventId)
            ->whereIn('status', Attendance::ACTIVE_STATUSES)
            ->latest('check_in_time')
            ->take($take)
            ->get();
    }

    public function eventHadirCount(Event $event): int
    {
        return $event->attendances()
            ->whereIn('status', [Attendance::STATUS_HADIR, Attendance::STATUS_TERLAMBAT])
            ->distinct()
            ->count('user_id');
    }
}
