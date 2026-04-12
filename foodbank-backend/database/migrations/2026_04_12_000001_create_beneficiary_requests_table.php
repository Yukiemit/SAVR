<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiary_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type');            // food | financial
            $table->string('request_name');
            $table->string('food_type')->nullable();
            $table->decimal('quantity', 10, 2)->nullable();
            $table->string('unit')->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->integer('population');
            $table->integer('age_min');
            $table->integer('age_max');
            $table->string('street');
            $table->string('barangay');
            $table->string('city');
            $table->string('zip_code');
            $table->date('request_date');
            $table->string('urgency');         // low | medium | high
            $table->string('status')->default('Pending'); // Pending | Allocated | Rejected
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiary_requests');
    }
};
