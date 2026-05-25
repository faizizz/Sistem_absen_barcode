<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Drives time-based event status transitions:
 *
 *   DRAFT  → ACTIVE   when now >= startMoment (and not past endMoment)
 *   DRAFT  → CLOSED   when now > endMoment    (window completely missed)
 *   ACTIVE → CLOSED   when now > endMoment
 *
 * Used by both the scheduler (truth) and on-the-fly fallback in
 * controllers (so listings stay accurate without cron).
 */
class EventLifecycleService
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    /**
     * Run the lifecycle sync at most once every $cooldownSeconds. Acts
     * as a fallback when no cron is available; the scheduled command is
     * still the primary driver.
     */
    public function syncIfStale(int $cooldownSeconds = 30): void
    {
        $lock = Cache::lock('event-lifecycle:throttle', $cooldownSeconds);

        if (! $lock->get()) {
            return;
        }

        try {
            $this->sync();
        } finally {
            // Keep the lock for the cooldown window so other requests skip.
            // (We intentionally do NOT release it here.)
        }
    }

    /**
     * Sweep all events whose status is stale relative to wall-clock time.
     *
     * @return array{opened: int, closed_from_draft: int, closed_from_active: int}
     */
    public function sync(?Carbon $now = null): array
    {
        $now ??= now();

        $opened = 0;
        $closedFromDraft = 0;
        $closedFromActive = 0;

        DB::transaction(function () use ($now, &$opened, &$closedFromDraft, &$closedFromActive): void {
            // Candidates whose status MIGHT be stale. Filter in PHP so we
            // can safely combine `tanggal` (date) with `waktu_*` (time).
            $today = $now->copy()->startOfDay()->toDateString();

            Event::query()
                ->whereIn('status', [Event::STATUS_DRAFT, Event::STATUS_ACTIVE])
                ->where(function ($q) use ($today): void {
                    // Only events on or before today can need transitioning.
                    $q->whereDate('tanggal', '<=', $today);
                })
                ->lockForUpdate()
                ->get()
                ->each(function (Event $event) use ($now, &$opened, &$closedFromDraft, &$closedFromActive): void {
                    $start = $event->startMoment();
                    $end = $event->endMoment();

                    if (! $start || ! $end) {
                        return;
                    }

                    if ($event->status === Event::STATUS_ACTIVE) {
                        if ($now->greaterThan($end)) {
                            $event->update(['status' => Event::STATUS_CLOSED]);
                            $closedFromActive++;
                            $this->audit->record(
                                'event.auto_close',
                                "Sistem menutup event '{$event->nama_kegiatan}' karena waktu selesai sudah lewat.",
                                $event,
                                ['from' => Event::STATUS_ACTIVE, 'to' => Event::STATUS_CLOSED],
                            );
                        }

                        return;
                    }

                    // DRAFT branch.
                    if ($now->greaterThan($end)) {
                        $event->update(['status' => Event::STATUS_CLOSED]);
                        $closedFromDraft++;
                        $this->audit->record(
                            'event.auto_close',
                            "Sistem menutup event '{$event->nama_kegiatan}' (terlewat tanpa diaktifkan).",
                            $event,
                            ['from' => Event::STATUS_DRAFT, 'to' => Event::STATUS_CLOSED],
                        );

                        return;
                    }

                    if ($now->greaterThanOrEqualTo($start)) {
                        $event->update(['status' => Event::STATUS_ACTIVE]);
                        $opened++;
                        $this->audit->record(
                            'event.auto_activate',
                            "Sistem mengaktifkan event '{$event->nama_kegiatan}' karena waktu mulai sudah tiba.",
                            $event,
                            ['from' => Event::STATUS_DRAFT, 'to' => Event::STATUS_ACTIVE],
                        );
                    }
                });
        });

        return [
            'opened' => $opened,
            'closed_from_draft' => $closedFromDraft,
            'closed_from_active' => $closedFromActive,
        ];
    }
}
