<?php

namespace App\Policies;

use App\Models\User;

class AttendancePolicy
{
    public function scan(User $user): bool
    {
        return $user->isAdmin();
    }

    public function export(User $user): bool
    {
        return $user->isAdmin();
    }

    public function reset(User $user): bool
    {
        return $user->isAdmin();
    }

    public function viewDashboard(User $user): bool
    {
        return $user->isAdmin();
    }
}
