<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donation_drives', function (Blueprint $table) {
            $table->unsignedBigInteger('beneficiary_request_id')->nullable()->after('donation_request_id');
            $table->foreign('beneficiary_request_id')
                  ->references('id')
                  ->on('beneficiary_requests')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('donation_drives', function (Blueprint $table) {
            $table->dropForeign(['beneficiary_request_id']);
            $table->dropColumn('beneficiary_request_id');
        });
    }
};
