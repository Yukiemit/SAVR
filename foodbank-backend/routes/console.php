<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\PruneUnverifiedUsers;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Prune unverified users every hour ────────────────────────────────────────
Schedule::command(PruneUnverifiedUsers::class)->hourly();
