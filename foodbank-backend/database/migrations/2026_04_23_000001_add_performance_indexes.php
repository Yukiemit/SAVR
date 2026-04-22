<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add indexes to the most frequently filtered/sorted columns.
 * These prevent full-table scans on every list/search query.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── users ─────────────────────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            // Prune query: WHERE email_verified_at IS NULL AND created_at < ?
            if (!$this->hasIndex('users', 'users_email_verified_at_index')) {
                $table->index('email_verified_at', 'users_email_verified_at_index');
            }
            if (!$this->hasIndex('users', 'users_role_index')) {
                $table->index('role', 'users_role_index');
            }
        });

        // ── food_donation_records ─────────────────────────────────────────────
        Schema::table('food_donation_records', function (Blueprint $table) {
            if (!$this->hasIndex('food_donation_records', 'fdr_status_index')) {
                $table->index('status', 'fdr_status_index');
            }
            if (!$this->hasIndex('food_donation_records', 'fdr_user_id_status_index')) {
                $table->index(['user_id', 'status'], 'fdr_user_id_status_index');
            }
            if (!$this->hasIndex('food_donation_records', 'fdr_created_at_index')) {
                $table->index('created_at', 'fdr_created_at_index');
            }
        });

        // ── financial_donation_records ────────────────────────────────────────
        Schema::table('financial_donation_records', function (Blueprint $table) {
            if (!$this->hasIndex('financial_donation_records', 'findr_status_index')) {
                $table->index('status', 'findr_status_index');
            }
            if (!$this->hasIndex('financial_donation_records', 'findr_user_id_index')) {
                $table->index('user_id', 'findr_user_id_index');
            }
            if (!$this->hasIndex('financial_donation_records', 'findr_created_at_index')) {
                $table->index('created_at', 'findr_created_at_index');
            }
        });

        // ── service_donation_records ──────────────────────────────────────────
        Schema::table('service_donation_records', function (Blueprint $table) {
            if (!$this->hasIndex('service_donation_records', 'sdr_status_index')) {
                $table->index('status', 'sdr_status_index');
            }
            if (!$this->hasIndex('service_donation_records', 'sdr_user_id_index')) {
                $table->index('user_id', 'sdr_user_id_index');
            }
            if (!$this->hasIndex('service_donation_records', 'sdr_created_at_index')) {
                $table->index('created_at', 'sdr_created_at_index');
            }
        });

        // ── service_donations_inventory ───────────────────────────────────────
        // (table may be named service_donations or service_donations_inventory)
        $sdiTable = Schema::hasTable('service_donations_inventory')
            ? 'service_donations_inventory'
            : 'service_donations';

        Schema::table($sdiTable, function (Blueprint $table) use ($sdiTable) {
            if (!$this->hasIndex($sdiTable, 'sdi_status_index')) {
                $table->index('status', 'sdi_status_index');
            }
        });

        // ── donation_requests ─────────────────────────────────────────────────
        Schema::table('donation_requests', function (Blueprint $table) {
            if (!$this->hasIndex('donation_requests', 'dr_status_index')) {
                $table->index('status', 'dr_status_index');
            }
            if (!$this->hasIndex('donation_requests', 'dr_created_at_index')) {
                $table->index('created_at', 'dr_created_at_index');
            }
        });

        // ── donation_drives ───────────────────────────────────────────────────
        Schema::table('donation_drives', function (Blueprint $table) {
            if (!$this->hasIndex('donation_drives', 'dd_status_index')) {
                $table->index('status', 'dd_status_index');
            }
            if (!$this->hasIndex('donation_drives', 'dd_created_at_index')) {
                $table->index('created_at', 'dd_created_at_index');
            }
        });

        // ── beneficiary_requests ──────────────────────────────────────────────
        if (Schema::hasTable('beneficiary_requests')) {
            Schema::table('beneficiary_requests', function (Blueprint $table) {
                if (!$this->hasIndex('beneficiary_requests', 'br_status_index')) {
                    $table->index('status', 'br_status_index');
                }
            });
        }

        // ── food_inventory ────────────────────────────────────────────────────
        Schema::table('food_inventory', function (Blueprint $table) {
            if (!$this->hasIndex('food_inventory', 'fi_category_index')) {
                $table->index('category', 'fi_category_index');
            }
            if (!$this->hasIndex('food_inventory', 'fi_expiration_date_index')) {
                $table->index('expiration_date', 'fi_expiration_date_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_email_verified_at_index');
            $table->dropIndex('users_role_index');
        });
        Schema::table('food_donation_records', function (Blueprint $table) {
            $table->dropIndex('fdr_status_index');
            $table->dropIndex('fdr_user_id_status_index');
            $table->dropIndex('fdr_created_at_index');
        });
        Schema::table('financial_donation_records', function (Blueprint $table) {
            $table->dropIndex('findr_status_index');
            $table->dropIndex('findr_user_id_index');
            $table->dropIndex('findr_created_at_index');
        });
        Schema::table('service_donation_records', function (Blueprint $table) {
            $table->dropIndex('sdr_status_index');
            $table->dropIndex('sdr_user_id_index');
            $table->dropIndex('sdr_created_at_index');
        });
        Schema::table('donation_requests', function (Blueprint $table) {
            $table->dropIndex('dr_status_index');
            $table->dropIndex('dr_created_at_index');
        });
        Schema::table('donation_drives', function (Blueprint $table) {
            $table->dropIndex('dd_status_index');
            $table->dropIndex('dd_created_at_index');
        });
        Schema::table('food_inventory', function (Blueprint $table) {
            $table->dropIndex('fi_category_index');
            $table->dropIndex('fi_expiration_date_index');
        });
    }

    /**
     * Check if an index already exists (prevents errors on re-run).
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = \DB::select(
            "SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            [$table, $indexName]
        );
        return count($indexes) > 0;
    }
};
