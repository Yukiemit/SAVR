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

            // Service tab: Transportation | Volunteer Work
            $table->string('service_tab')->nullable();
            $table->unsignedInteger('quantity')->nullable();

            // Schedule
            $table->string('frequency');               // Monthly | Weekly | Daily | One-Time
            $table->date('date')->nullable();           // Monthly / One-Time: specific date
            $table->string('day_of_week')->nullable();  // Weekly: Monday–Sunday

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

            // Transportation-specific
            $table->string('vehicle_type')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->unsignedInteger('max_distance')->nullable();
            $table->json('transport_categories')->nullable();

            // Volunteer Work-specific
            $table->unsignedInteger('headcount')->nullable();
            $table->string('preferred_work')->nullable();
            $table->json('skill_categories')->nullable();

            // Staff review
            $table->string('status')->default('pending');  // pending | accepted | declined
            $table->text('staff_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_donation_records');
    }
};
