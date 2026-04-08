<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stage 2 — confirmed service donations (after staff approves a record).
 * Mirrors the food_donations pattern.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_donations', function (Blueprint $table) {
            $table->id();

            // Link back to the pending record that was approved
            $table->foreignId('service_donation_record_id')
                  ->constrained('service_donation_records')
                  ->onDelete('cascade');

            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Copy of all service details
            $table->string('service_type');
            $table->unsignedInteger('quantity')->default(1);
            $table->enum('frequency', ['Monthly', 'Weekly', 'Daily', 'One-Time']);
            $table->date('date')->nullable();
            $table->string('day_of_week')->nullable();
            $table->boolean('all_day')->default(false);
            $table->time('starts_at')->nullable();
            $table->time('ends_at')->nullable();
            $table->string('address');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->text('notes')->nullable();
            $table->text('staff_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_donations');
    }
};
