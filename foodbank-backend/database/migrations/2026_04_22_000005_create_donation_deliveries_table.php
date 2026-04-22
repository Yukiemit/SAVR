<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('donation_deliveries')) {
            Schema::create('donation_deliveries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('donation_drive_id')
                      ->constrained('donation_drives')
                      ->onDelete('cascade');
                // status: in_transit | received | cancelled
                $table->string('status')->default('in_transit');
                // JSON snapshot: [{food_inventory_id, food_name, qty, unit, expiration_date}]
                $table->json('delivery_items');
                $table->text('notes')->nullable();
                $table->timestamp('prepared_at')->nullable();
                $table->timestamp('received_at')->nullable();
                $table->timestamp('cancelled_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_deliveries');
    }
};
