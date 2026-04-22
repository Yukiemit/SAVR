<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Works whether the table has been renamed yet or not
        $table = Schema::hasTable('service_donations_inventory')
            ? 'service_donations_inventory'
            : 'service_donations';

        Schema::table($table, function (Blueprint $t) use ($table) {
            if (!Schema::hasColumn($table, 'status')) {
                $t->string('status')->default('active')->after('staff_notes');
            }
        });
    }

    public function down(): void
    {
        $table = Schema::hasTable('service_donations_inventory')
            ? 'service_donations_inventory'
            : 'service_donations';

        Schema::table($table, function (Blueprint $t) use ($table) {
            if (Schema::hasColumn($table, 'status')) {
                $t->dropColumn('status');
            }
        });
    }
};
