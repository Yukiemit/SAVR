<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('food_inventory', function (Blueprint $table) {
            if (Schema::hasColumn('food_inventory', 'donor_name')) {
                $table->dropColumn('donor_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('food_inventory', function (Blueprint $table) {
            $table->string('donor_name')->nullable();
        });
    }
};
