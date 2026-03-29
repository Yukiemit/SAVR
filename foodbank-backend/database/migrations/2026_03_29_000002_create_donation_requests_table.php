<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donation_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('contact');
            $table->string('address');
            $table->enum('urgency', ['low', 'medium', 'high', 'critical']);
            $table->integer('pax')->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['Pending', 'Allocated', 'Declined', 'Done'])->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_requests');
    }
};