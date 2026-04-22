<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('donation_drives', function (Blueprint $table) {
            if (!Schema::hasColumn('donation_drives', 'prepared_at')) {
                $table->timestamp('prepared_at')->nullable();
            }
            if (!Schema::hasColumn('donation_drives', 'transit_at')) {
                $table->timestamp('transit_at')->nullable();
            }
            if (!Schema::hasColumn('donation_drives', 'received_at')) {
                $table->timestamp('received_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('donation_drives', function (Blueprint $table) {
            $table->dropColumn(['prepared_at', 'transit_at', 'received_at']);
        });
    }
};
