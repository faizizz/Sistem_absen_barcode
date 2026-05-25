<?php

namespace App\Providers;

use App\Models\Event;
use App\Models\Profile;
use App\Policies\AttendancePolicy;
use App\Policies\EventPolicy;
use App\Policies\MemberPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Event::class => EventPolicy::class,
        Profile::class => MemberPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        $attendance = new AttendancePolicy();
        Gate::define('attendance.scan', [$attendance, 'scan']);
        Gate::define('attendance.export', [$attendance, 'export']);
        Gate::define('attendance.reset', [$attendance, 'reset']);
        Gate::define('attendance.view-dashboard', [$attendance, 'viewDashboard']);
    }
}
