<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class PruneUnverifiedUsers extends Command
{
    protected $signature   = 'users:prune-unverified';
    protected $description = 'Delete users who never verified their email within 24 hours of registration';

    public function handle(): int
    {
        $deleted = User::whereNull('email_verified_at')
            ->where('created_at', '<', now()->subHours(24))
            ->delete();

        $this->info("Pruned {$deleted} unverified user(s).");

        return Command::SUCCESS;
    }
}
