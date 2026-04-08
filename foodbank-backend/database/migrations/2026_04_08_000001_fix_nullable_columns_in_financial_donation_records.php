<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Makes receipt_number and other optional columns nullable
 * so PayMongo donations (which have no receipt number at submission time)
 * can be inserted without errors.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('financial_donation_records', function (Blueprint $table) {
            // Make receipt_number nullable (PayMongo fills it via webhook, not at creation)
            $table->string('receipt_number')->nullable()->change();

            // Make sure these are also nullable (safety net)
            $table->string('receipt_path')->nullable()->change();
            $table->string('payment_method')->nullable()->change();
            $table->text('message')->nullable()->change();
            $table->text('staff_notes')->nullable()->change();
            $table->timestamp('donated_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        // No need to reverse — nullable is always safer
    }
};
