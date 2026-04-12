<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // ── service_donation_records ─────────────────────────────────────────
        Schema::table('service_donation_records', function (Blueprint $table) {
            if (!Schema::hasColumn('service_donation_records', 'service_tab'))
                $table->string('service_tab')->nullable()->after('user_id');

            // Transportation fields
            if (!Schema::hasColumn('service_donation_records', 'vehicle_type'))
                $table->string('vehicle_type')->nullable();
            if (!Schema::hasColumn('service_donation_records', 'capacity'))
                $table->unsignedInteger('capacity')->nullable();
            if (!Schema::hasColumn('service_donation_records', 'max_distance'))
                $table->unsignedInteger('max_distance')->nullable();
            if (!Schema::hasColumn('service_donation_records', 'transport_categories'))
                $table->json('transport_categories')->nullable();

            // Volunteer fields
            if (!Schema::hasColumn('service_donation_records', 'headcount'))
                $table->unsignedInteger('headcount')->nullable();
            if (!Schema::hasColumn('service_donation_records', 'preferred_work'))
                $table->string('preferred_work')->nullable();
            if (!Schema::hasColumn('service_donation_records', 'skill_categories'))
                $table->json('skill_categories')->nullable();

            // Make quantity nullable (volunteer tab uses headcount instead)
            $table->unsignedInteger('quantity')->nullable()->change();
        });

        // Convert status enum → VARCHAR so accepted/declined values work
        DB::statement("ALTER TABLE service_donation_records MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        DB::statement("UPDATE service_donation_records SET status = 'accepted' WHERE status = 'approved'");
        DB::statement("UPDATE service_donation_records SET status = 'declined' WHERE status = 'rejected'");

        // ── service_donations (confirmed table) ──────────────────────────────
        Schema::table('service_donations', function (Blueprint $table) {
            if (!Schema::hasColumn('service_donations', 'service_tab'))
                $table->string('service_tab')->nullable()->after('user_id');

            if (!Schema::hasColumn('service_donations', 'vehicle_type'))
                $table->string('vehicle_type')->nullable();
            if (!Schema::hasColumn('service_donations', 'capacity'))
                $table->unsignedInteger('capacity')->nullable();
            if (!Schema::hasColumn('service_donations', 'max_distance'))
                $table->unsignedInteger('max_distance')->nullable();
            if (!Schema::hasColumn('service_donations', 'transport_categories'))
                $table->json('transport_categories')->nullable();

            if (!Schema::hasColumn('service_donations', 'headcount'))
                $table->unsignedInteger('headcount')->nullable();
            if (!Schema::hasColumn('service_donations', 'preferred_work'))
                $table->string('preferred_work')->nullable();
            if (!Schema::hasColumn('service_donations', 'skill_categories'))
                $table->json('skill_categories')->nullable();

            $table->unsignedInteger('quantity')->nullable()->change();
        });
    }

    public function down(): void {}
};
