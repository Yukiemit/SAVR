<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── STAGE 1: Donor submits → goes here (pending staff review or PayMongo auto-confirm)
        Schema::create('financial_donation_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // 'manual'   = donor uploaded a receipt (needs staff review)
            // 'paymongo' = paid via PayMongo checkout (auto-approved via webhook)
            $table->enum('payment_type', ['manual', 'paymongo'])->default('manual');

            // For manual: 'GCash' | 'Bank Transfer'
            // For PayMongo: filled by webhook e.g. 'gcash' | 'card' | 'grab_pay' | 'maya'
            $table->string('payment_method')->nullable();

            $table->string('receipt_path')->nullable();     // manual only
            $table->string('receipt_number')->nullable();   // manual: ref no; PayMongo: filled by webhook
            $table->decimal('amount', 12, 2);
            $table->timestamp('donated_at')->nullable();    // manual: donor-entered; PayMongo: webhook time
            $table->text('message')->nullable();

            // PayMongo-specific fields (null for manual donations)
            $table->string('paymongo_link_id')->nullable();    // Payment Link ID
            $table->string('paymongo_payment_id')->nullable(); // filled when payment.paid fires

            // Staff review / outcome
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('staff_notes')->nullable();

            $table->timestamps();
        });

        // ── STAGE 2: Confirmed donations → the "bank" / inventory table ─────────
        Schema::create('financial_donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_donation_record_id')
                  ->constrained('financial_donation_records')
                  ->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->enum('payment_type', ['manual', 'paymongo'])->default('manual');
            $table->string('payment_method')->nullable();
            $table->string('receipt_path')->nullable();
            $table->string('receipt_number')->nullable();
            $table->decimal('amount', 12, 2);
            $table->timestamp('donated_at')->nullable();
            $table->text('message')->nullable();
            $table->string('paymongo_payment_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_donations');
        Schema::dropIfExists('financial_donation_records');
    }
};
