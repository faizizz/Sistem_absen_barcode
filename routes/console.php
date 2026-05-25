<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function (): void {
    $this->comment('Attendance app is ready to inspire the next scan.');
});

// Run every minute so events flip status close to wall-clock time.
// Requires either a server cron (* * * * * php artisan schedule:run)
// or `php artisan schedule:work` during local development.
Schedule::command('app:sync-event-lifecycle')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
