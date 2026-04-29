<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('truck_stops', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('truck_id')->nullable();
            $table->enum('stop_type', ['PICKUP', 'DELIVER']);
            $table->string('name');
            $table->string('address');
            $table->date('date')->nullable();
            $table->time('time_slot_start')->nullable();
            $table->time('time_slot_end')->nullable();
            $table->text('food_items')->nullable();
            $table->string('food_name')->nullable();
            $table->string('food_type')->nullable();
            $table->string('qty')->nullable();
            $table->string('unit')->nullable();
            $table->string('source'); // food_donation, donation_drive
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->integer('stop_order')->default(0);
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('truck_id')->references('id')->on('trucks')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('truck_stops');
    }
};
