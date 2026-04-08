<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_donation_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // What kind of service
            $table->string('service_type');   // Transportation | Volunteer Work | Cooking Assistance
            $table->unsignedInteger('quantity')->default(1);

            // Schedule
            $table->enum('frequency', ['Monthly', 'Weekly', 'Daily', 'One-Time']);
            $table->date('date')->nullable();         // Monthly / One-Time: specific date
            $table->string('day_of_week')->nullable(); // Weekly: Monday–Sunday

            // Time
            $table->boolean('all_day')->default(false);
            $table->time('starts_at')->nullable();
            $table->time('ends_at')->nullable();

            // Location & Contact
            $table->string('address');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->text('notes')->nullable();

            // Staff review
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('staff_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_donation_records');
    }
};
