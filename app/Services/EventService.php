<?php

namespace App\Services;

use App\DTO\EventData;
use App\Models\Event;
use DomainException;

class EventService
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function create(EventData $data, int $creatorId): Event
    {
        $event = Event::create([
            ...$data->toArray(),
            'status' => Event::STATUS_DRAFT,
            'created_by' => $creatorId,
        ]);

        $this->audit->record(
            'event.create',
            "Membuat event '{$event->nama_kegiatan}'",
            $event,
        );

        return $event;
    }

    public function update(Event $event, EventData $data): Event
    {
        $this->ensureStatus($event, Event::STATUS_DRAFT, 'diubah');

        $event->update($data->toArray());

        $this->audit->record(
            'event.update',
            "Mengubah event '{$event->nama_kegiatan}'",
            $event,
        );

        return $event;
    }

    public function delete(Event $event): void
    {
        $this->ensureStatus($event, Event::STATUS_DRAFT, 'dihapus');

        $name = $event->nama_kegiatan;
        $event->delete();

        $this->audit->record('event.delete', "Menghapus event '{$name}'");
    }

    public function activate(Event $event): Event
    {
        $this->ensureStatus($event, Event::STATUS_DRAFT, 'diaktifkan');

        $event->update(['status' => Event::STATUS_ACTIVE]);

        $this->audit->record(
            'event.activate',
            "Mengaktifkan event '{$event->nama_kegiatan}'",
            $event,
        );

        return $event;
    }

    public function close(Event $event): Event
    {
        if ($event->status !== Event::STATUS_ACTIVE) {
            throw new DomainException('Hanya event aktif yang dapat ditutup.');
        }

        $event->update(['status' => Event::STATUS_CLOSED]);

        $this->audit->record(
            'event.close',
            "Menutup event '{$event->nama_kegiatan}'",
            $event,
        );

        return $event;
    }

    private function ensureStatus(Event $event, string $required, string $action): void
    {
        if ($event->status !== $required) {
            throw new DomainException("Hanya event berstatus {$required} yang dapat {$action}.");
        }
    }
}
