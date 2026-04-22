<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('food_inventory', function (Blueprint $table) {
            if (!Schema::hasColumn('food_inventory', 'meal_type')) {
                $table->string('meal_type')->default('Raw Ingredients'); // Raw Ingredients | Prepared Meals
            }
            if (!Schema::hasColumn('food_inventory', 'donor_name')) {
                $table->string('donor_name')->nullable();
            }
            if (!Schema::hasColumn('food_inventory', 'special_notes')) {
                $table->text('special_notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('food_inventory', function (Blueprint $table) {
            $table->dropColumn(['meal_type', 'donor_name', 'special_notes']);
        });
    }
};
