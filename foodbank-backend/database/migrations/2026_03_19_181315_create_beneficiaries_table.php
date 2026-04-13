<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('beneficiaries')) {
            Schema::create('beneficiaries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->string('suffix')->nullable();
                $table->string('gender')->nullable();
                $table->date('dob')->nullable();
                $table->string('house')->nullable();
                $table->string('street')->nullable();
                $table->string('barangay')->nullable();
                $table->string('city')->nullable();
                $table->string('province')->nullable();
                $table->string('zip')->nullable();
                $table->string('contact')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiaries');
    }
};
