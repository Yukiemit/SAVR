<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('food_inventory', function (Blueprint $table) {
            $table->id();
            $table->string('food_name');
            $table->string('category')->nullable();      // e.g. "Canned Goods"
            $table->unsignedInteger('quantity')->default(0); // available stock
            $table->string('unit')->nullable();          // e.g. "cans", "kg"
            $table->date('expiration_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_inventory');
    }
};
