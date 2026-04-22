<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('donation_drive_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_drive_id')->constrained('donation_drives')->onDelete('cascade');
            $table->foreignId('food_inventory_id')->nullable()->constrained('food_inventory')->onDelete('set null');
            $table->string('food_name');
            $table->string('category')->nullable();
            $table->unsignedInteger('goal_qty')->default(0);      // target quantity
            $table->unsignedInteger('allocated_qty')->default(0); // how much has been sent
            $table->string('unit')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_drive_items');
    }
};
