<?php

namespace App\Policies;

use App\Models\Profile;
use App\Models\User;

class MemberPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Profile $profile): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Profile $profile): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Profile $profile): bool
    {
        return $user->isAdmin();
    }
}
