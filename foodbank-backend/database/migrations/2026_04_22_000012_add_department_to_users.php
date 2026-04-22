<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'department')) {
                $table->string('department')->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'email_verified')) {
                $table->boolean('email_verified')->default(false)->after('department');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['department']);
        });
    }
};
