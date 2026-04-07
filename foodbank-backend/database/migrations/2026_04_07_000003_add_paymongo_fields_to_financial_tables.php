<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds PayMongo-specific columns that were missing from the initial
 * financial_donation_records / financial_donations tables.
 *
 * Safe to run even if columns already exist (uses hasColumn checks).
 */
return new class extends Migration {
    public function up(): void
    {
        // ── financial_donation_records ────────────────────────────────────────
        if (Schema::hasTable('financial_donation_records')) {
            Schema::table('financial_donation_records', function (Blueprint $table) {

                if (!Schema::hasColumn('financial_donation_records', 'payment_type')) {
                    $table->enum('payment_type', ['manual', 'paymongo'])
                          ->default('manual')
                          ->after('user_id');
                }
                if (!Schema::hasColumn('financial_donation_records', 'payment_method')) {
                    $table->string('payment_method')->nullable()->after('payment_type');
                }
                if (!Schema::hasColumn('financial_donation_records', 'receipt_path')) {
                    $table->string('receipt_path')->nullable()->after('payment_method');
                }
                if (!Schema::hasColumn('financial_donation_records', 'receipt_number')) {
                    $table->string('receipt_number')->nullable()->after('receipt_path');
                }
                if (!Schema::hasColumn('financial_donation_records', 'amount')) {
                    $table->decimal('amount', 12, 2)->after('receipt_number');
                }
                if (!Schema::hasColumn('financial_donation_records', 'donated_at')) {
                    $table->timestamp('donated_at')->nullable()->after('amount');
                }
                if (!Schema::hasColumn('financial_donation_records', 'message')) {
                    $table->text('message')->nullable()->after('donated_at');
                }
                if (!Schema::hasColumn('financial_donation_records', 'paymongo_link_id')) {
                    $table->string('paymongo_link_id')->nullable()->after('message');
                }
                if (!Schema::hasColumn('financial_donation_records', 'paymongo_payment_id')) {
                    $table->string('paymongo_payment_id')->nullable()->after('paymongo_link_id');
                }
                if (!Schema::hasColumn('financial_donation_records', 'status')) {
                    $table->enum('status', ['pending', 'approved', 'rejected'])
                          ->default('pending')
                          ->after('paymongo_payment_id');
                }
                if (!Schema::hasColumn('financial_donation_records', 'staff_notes')) {
                    $table->text('staff_notes')->nullable()->after('status');
                }
            });
        } else {
            // Table doesn't exist at all — create it fresh
            Schema::create('financial_donation_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('payment_type', ['manual', 'paymongo'])->default('manual');
                $table->string('payment_method')->nullable();
                $table->string('receipt_path')->nullable();
                $table->string('receipt_number')->nullable();
                $table->decimal('amount', 12, 2);
                $table->timestamp('donated_at')->nullable();
                $table->text('message')->nullable();
                $table->string('paymongo_link_id')->nullable();
                $table->string('paymongo_payment_id')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->text('staff_notes')->nullable();
                $table->timestamps();
            });
        }

        // ── financial_donations ───────────────────────────────────────────────
        if (Schema::hasTable('financial_donations')) {
            Schema::table('financial_donations', function (Blueprint $table) {

                if (!Schema::hasColumn('financial_donations', 'financial_donation_record_id')) {
                    $table->foreignId('financial_donation_record_id')
                          ->nullable()
                          ->constrained('financial_donation_records')
                          ->onDelete('cascade')
                          ->after('id');
                }
                if (!Schema::hasColumn('financial_donations', 'payment_type')) {
                    $table->enum('payment_type', ['manual', 'paymongo'])
                          ->default('manual')
                          ->after('user_id');
                }
                if (!Schema::hasColumn('financial_donations', 'payment_method')) {
                    $table->string('payment_method')->nullable()->after('payment_type');
                }
                if (!Schema::hasColumn('financial_donations', 'receipt_path')) {
                    $table->string('receipt_path')->nullable()->after('payment_method');
                }
                if (!Schema::hasColumn('financial_donations', 'receipt_number')) {
                    $table->string('receipt_number')->nullable()->after('receipt_path');
                }
                if (!Schema::hasColumn('financial_donations', 'amount')) {
                    $table->decimal('amount', 12, 2)->after('receipt_number');
                }
                if (!Schema::hasColumn('financial_donations', 'donated_at')) {
                    $table->timestamp('donated_at')->nullable()->after('amount');
                }
                if (!Schema::hasColumn('financial_donations', 'message')) {
                    $table->text('message')->nullable()->after('donated_at');
                }
                if (!Schema::hasColumn('financial_donations', 'paymongo_payment_id')) {
                    $table->string('paymongo_payment_id')->nullable()->after('message');
                }
            });
        } else {
            // Table doesn't exist at all — create it fresh
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
    }

    public function down(): void
    {
        // Reversing an ALTER is tricky — just drop columns if they exist
        if (Schema::hasTable('financial_donations')) {
            Schema::table('financial_donations', function (Blueprint $table) {
                $cols = ['payment_type', 'payment_method', 'receipt_path', 'receipt_number',
                         'amount', 'donated_at', 'message', 'paymongo_payment_id',
                         'financial_donation_record_id'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('financial_donations', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
        if (Schema::hasTable('financial_donation_records')) {
            Schema::table('financial_donation_records', function (Blueprint $table) {
                $cols = ['payment_type', 'payment_method', 'receipt_path', 'receipt_number',
                         'amount', 'donated_at', 'message', 'paymongo_link_id',
                         'paymongo_payment_id', 'status', 'staff_notes'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('financial_donation_records', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
