<?php

namespace App\Console\Commands;

use App\Models\Profile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearQrTokens extends Command
{
    protected $signature = 'app:clear-qr-tokens';

    protected $description = 'Clear stored QR tokens so members generate a new QR after entering their NIM.';

    public function handle(): int
    {
        $count = Profile::query()->whereNotNull('qr_token')->count();
        DB::table('profiles')->update(['qr_token' => null]);

        $this->info("Cleared qr_token for {$count} profile(s).");

        return self::SUCCESS;
    }
}
