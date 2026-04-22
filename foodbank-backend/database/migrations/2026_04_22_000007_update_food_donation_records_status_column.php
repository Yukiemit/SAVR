<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL: drop the enum CHECK constraint, change to plain string
        // so we can store: pending, accepted, received, approved, rejected
        DB::statement("
            ALTER TABLE food_donation_records
            ALTER COLUMN status TYPE VARCHAR(20)
        ");

        // Add timestamp columns if not already added by migration 000006
        Schema::table('food_donation_records', function (Blueprint $table) {
            if (!Schema::hasColumn('food_donation_records', 'accepted_at')) {
                $table->timestamp('accepted_at')->nullable()->after('staff_notes');
            }
            if (!Schema::hasColumn('food_donation_records', 'received_at')) {
                $table->timestamp('received_at')->nullable()->after('accepted_at');
            }
            if (!Schema::hasColumn('food_donation_records', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('received_at');
            }
        });
    }

    public function down(): void
    {
        // Revert to original enum (only safe if no 'accepted'/'received' rows exist)
        DB::statement("
            ALTER TABLE food_donation_records
            ALTER COLUMN status TYPE VARCHAR(20)
        ");
    }
};
