<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('unit_number')->unique();
            $table->string('vehicle_type');
            $table->integer('capacity')->nullable();
            $table->string('current_address')->nullable();
            $table->json('categories')->nullable();
            $table->enum('source', ['manual', 'service_donation'])->default('manual');
            $table->unsignedBigInteger('service_donation_id')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
