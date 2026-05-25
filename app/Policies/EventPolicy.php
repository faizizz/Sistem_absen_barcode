<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Event $event): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Event $event): bool
    {
        return $user->isAdmin() && $event->status === Event::STATUS_DRAFT;
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->isAdmin() && $event->status === Event::STATUS_DRAFT;
    }

    public function activate(User $user, Event $event): bool
    {
        return $user->isAdmin() && $event->status === Event::STATUS_DRAFT;
    }

    public function close(User $user, Event $event): bool
    {
        return $user->isAdmin() && $event->status === Event::STATUS_ACTIVE;
    }

    public function markAlpha(User $user, Event $event): bool
    {
        return $user->isAdmin() && $event->status === Event::STATUS_CLOSED;
    }

    public function recordPermission(User $user, Event $event): bool
    {
        return $user->isAdmin();
    }
}
