<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donation_drives', function (Blueprint $table) {
            $table->id();

            // ✅ LINKED TO DONATION REQUEST (nullable for manually created drives)
            $table->foreignId('donation_request_id')->nullable()->constrained('donation_requests')->onDelete('set null');

            // ✅ STAFF WHO CREATED/ALLOCATED IT
            $table->foreignId('staff_id')->nullable()->constrained('users')->onDelete('set null');

            // ── DRIVE DETAILS ──
            $table->string('drive_title');
            $table->enum('type', ['Food', 'Financial'])->default('Food');
            $table->string('goal')->nullable();         // e.g. "500 Meals" or "₱100,000"
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // ── AUTO-FILLED FROM REQUEST ──
            $table->string('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact')->nullable();
            $table->string('email')->nullable();

            $table->enum('status', ['Pending', 'OnGoing', 'Done', 'Cancelled'])->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_drives');
    }
};