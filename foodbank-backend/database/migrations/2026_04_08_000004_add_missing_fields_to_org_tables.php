<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── donor_organizations: add contact person first/last name + email ──
        Schema::table('donor_organizations', function (Blueprint $table) {
            if (!Schema::hasColumn('donor_organizations', 'first_name'))
                $table->string('first_name')->nullable()->after('contact_person');
            if (!Schema::hasColumn('donor_organizations', 'last_name'))
                $table->string('last_name')->nullable()->after('first_name');
            if (!Schema::hasColumn('donor_organizations', 'email'))
                $table->string('email')->nullable()->after('last_name');
        });

        // ── beneficiary_organizations: add all missing fields ─────────────────
        Schema::table('beneficiary_organizations', function (Blueprint $table) {
            // Rename industry → sector alias (keep industry, add sector)
            if (!Schema::hasColumn('beneficiary_organizations', 'sector'))
                $table->string('sector')->nullable()->after('industry');

            // Address fields
            if (!Schema::hasColumn('beneficiary_organizations', 'house'))
                $table->string('house')->nullable()->after('sector');
            if (!Schema::hasColumn('beneficiary_organizations', 'barangay'))
                $table->string('barangay')->nullable()->after('house');
            if (!Schema::hasColumn('beneficiary_organizations', 'street'))
                $table->string('street')->nullable()->after('barangay');
            if (!Schema::hasColumn('beneficiary_organizations', 'city'))
                $table->string('city')->nullable()->after('street');
            if (!Schema::hasColumn('beneficiary_organizations', 'province'))
                $table->string('province')->nullable()->after('city');
            if (!Schema::hasColumn('beneficiary_organizations', 'zip'))
                $table->string('zip')->nullable()->after('province');

            // Contact person details
            if (!Schema::hasColumn('beneficiary_organizations', 'first_name'))
                $table->string('first_name')->nullable()->after('contact_person');
            if (!Schema::hasColumn('beneficiary_organizations', 'last_name'))
                $table->string('last_name')->nullable()->after('first_name');
            if (!Schema::hasColumn('beneficiary_organizations', 'position'))
                $table->string('position')->nullable()->after('last_name');
            if (!Schema::hasColumn('beneficiary_organizations', 'email'))
                $table->string('email')->nullable()->after('position');

            // Beneficiary count fields
            if (!Schema::hasColumn('beneficiary_organizations', 'count_infants'))
                $table->unsignedInteger('count_infants')->default(0)->after('email');
            if (!Schema::hasColumn('beneficiary_organizations', 'count_children'))
                $table->unsignedInteger('count_children')->default(0)->after('count_infants');
            if (!Schema::hasColumn('beneficiary_organizations', 'count_teenagers'))
                $table->unsignedInteger('count_teenagers')->default(0)->after('count_children');
            if (!Schema::hasColumn('beneficiary_organizations', 'count_adults'))
                $table->unsignedInteger('count_adults')->default(0)->after('count_teenagers');
            if (!Schema::hasColumn('beneficiary_organizations', 'count_seniors'))
                $table->unsignedInteger('count_seniors')->default(0)->after('count_adults');
            if (!Schema::hasColumn('beneficiary_organizations', 'count_pwd'))
                $table->unsignedInteger('count_pwd')->default(0)->after('count_seniors');
            if (!Schema::hasColumn('beneficiary_organizations', 'count_pregnant'))
                $table->unsignedInteger('count_pregnant')->default(0)->after('count_pwd');
        });
    }

    public function down(): void
    {
        Schema::table('donor_organizations', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'email']);
        });
        Schema::table('beneficiary_organizations', function (Blueprint $table) {
            $table->dropColumn([
                'sector', 'house', 'barangay', 'street', 'city', 'province', 'zip',
                'first_name', 'last_name', 'position', 'email',
                'count_infants', 'count_children', 'count_teenagers',
                'count_adults', 'count_seniors', 'count_pwd', 'count_pregnant',
            ]);
        });
    }
};
