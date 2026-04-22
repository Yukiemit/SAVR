<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rename only if old name exists and new name doesn't
        if (Schema::hasTable('service_donations') && !Schema::hasTable('service_donations_inventory')) {
            Schema::rename('service_donations', 'service_donations_inventory');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('service_donations_inventory') && !Schema::hasTable('service_donations')) {
            Schema::rename('service_donations_inventory', 'service_donations');
        }
    }
};
