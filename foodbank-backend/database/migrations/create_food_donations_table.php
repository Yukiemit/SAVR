<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('food_donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Schedule
            $table->enum('mode', ['pickup', 'delivery']);
            $table->string('pickup_address')->nullable();
            $table->decimal('pickup_lat', 10, 7)->nullable();
            $table->decimal('pickup_lng', 10, 7)->nullable();
            $table->string('delivery_address')->nullable();
            $table->date('preferred_date');
            $table->time('time_slot_start');
            $table->time('time_slot_end');

            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('food_donation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_donation_id')->constrained()->onDelete('cascade');
            $table->string('food_name');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->string('category');
            $table->date('expiration_date');
            $table->text('special_notes')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_donation_items');
        Schema::dropIfExists('food_donations');
    }
};