<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL keeps the CHECK constraint as a separate named object even after
        // ALTER COLUMN TYPE. We must drop it explicitly so 'accepted' and 'received'
        // are allowed as status values.
        DB::statement("
            ALTER TABLE food_donation_records
            DROP CONSTRAINT IF EXISTS food_donation_records_status_check
        ");

        // Ensure column is plain VARCHAR (in case migration 000007 wasn't run)
        DB::statement("
            ALTER TABLE food_donation_records
            ALTER COLUMN status TYPE VARCHAR(20)
        ");

        // Ensure timestamp columns exist (in case migration 000006 wasn't run)
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
        // Re-add the check constraint with only original statuses
        DB::statement("
            ALTER TABLE food_donation_records
            ADD CONSTRAINT food_donation_records_status_check
            CHECK (status IN ('pending', 'approved', 'rejected'))
        ");
    }
};
