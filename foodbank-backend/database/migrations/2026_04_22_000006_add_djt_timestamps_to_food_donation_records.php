<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
        Schema::table('food_donation_records', function (Blueprint $table) {
            $cols = ['accepted_at', 'received_at', 'rejected_at'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('food_donation_records', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
