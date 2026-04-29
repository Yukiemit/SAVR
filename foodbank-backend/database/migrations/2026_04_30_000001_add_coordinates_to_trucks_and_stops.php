<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('trucks', function (Blueprint $table) {
            $table->decimal('latitude',  10, 7)->nullable()->after('current_address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
        Schema::table('truck_stops', function (Blueprint $table) {
            $table->decimal('latitude',  10, 7)->nullable()->after('address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('trucks',      fn($t) => $t->dropColumn(['latitude','longitude']));
        Schema::table('truck_stops', fn($t) => $t->dropColumn(['latitude','longitude']));
    }
};
