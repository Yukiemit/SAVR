<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_donations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('service_donation_record_id')
                  ->constrained('service_donation_records')
                  ->onDelete('cascade');

            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Service tab
            $table->string('service_tab')->nullable();
            $table->string('frequency');
            $table->date('date')->nullable();
            $table->string('day_of_week')->nullable();
            $table->boolean('all_day')->default(false);
            $table->time('starts_at')->nullable();
            $table->time('ends_at')->nullable();
            $table->string('address');

            // Transportation-specific
            $table->unsignedInteger('quantity')->nullable();
            $table->string('vehicle_type')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->unsignedInteger('max_distance')->nullable();
            $table->json('transport_categories')->nullable();

            // Volunteer Work-specific
            $table->unsignedInteger('headcount')->nullable();
            $table->string('preferred_work')->nullable();
            $table->json('skill_categories')->nullable();

            // Contact
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
