<?php

namespace App\Console\Commands;

use App\Services\EventLifecycleService;
use Illuminate\Console\Command;

class SyncEventLifecycle extends Command
{
    protected $signature = 'app:sync-event-lifecycle';

    protected $description = 'Auto-activate events whose start time has arrived and auto-close events past their end time.';

    public function handle(EventLifecycleService $lifecycle): int
    {
        $result = $lifecycle->sync();

        $this->info(sprintf(
            'Sync done. opened=%d, closed_from_active=%d, closed_from_draft=%d',
            $result['opened'],
            $result['closed_from_active'],
            $result['closed_from_draft'],
        ));

        return self::SUCCESS;
    }
}
