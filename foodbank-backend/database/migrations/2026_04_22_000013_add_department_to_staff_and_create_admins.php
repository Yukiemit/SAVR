<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add department to existing staff table
        Schema::table('staff', function (Blueprint $table) {
            if (!Schema::hasColumn('staff', 'department')) {
                $table->string('department')->nullable()->after('contact');
            }
        });

        // Create admins table (mirrors staff table)
        if (!Schema::hasTable('admins')) {
            Schema::create('admins', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('first_name')->nullable();
                $table->string('middle_name')->nullable();
                $table->string('last_name')->nullable();
                $table->string('suffix')->nullable();
                $table->string('gender')->nullable();
                $table->date('dob')->nullable();
                $table->string('contact')->nullable();
                $table->string('department')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            if (Schema::hasColumn('staff', 'department')) {
                $table->dropColumn('department');
            }
        });
        Schema::dropIfExists('admins');
    }
};
