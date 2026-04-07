<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FinancialDonation;
use App\Models\FinancialDonationRecord;
use App\Models\FoodDonationRecord;

class DonorController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // GET /donor/stats
    // Dashboard stat cards — only counts APPROVED donations
    // ══════════════════════════════════════════════════════════════════
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        // Total financial: sum of confirmed (approved) financial donations
        $totalFinancial = FinancialDonation::where('user_id', $userId)
            ->sum('amount');

        // Total food: count of approved food donation records
        $totalFoodCount = FoodDonationRecord::where('user_id', $userId)
            ->where('status', 'approved')
            ->count();

        // Total count: all submissions (pending + approved + rejected) across both types
        $financialCount = FinancialDonationRecord::where('user_id', $userId)->count();
        $foodCount      = FoodDonationRecord::where('user_id', $userId)->count();

        return response()->json([
            'total_financial'  => (float) $totalFinancial,
            'total_food_count' => $totalFoodCount,
            'total_count'      => $financialCount + $foodCount,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /donor/donations
    // Combined donation history for the dashboard table & report
    // ══════════════════════════════════════════════════════════════════
    public function donations(Request $request)
    {
        $userId = $request->user()->id;
        $type   = $request->type   ?? 'All';
        $range  = $request->range  ?? 'all_time';
        $from   = $request->from   ?? null;
        $to     = $request->to     ?? null;

        $rows = collect();

        // ── Financial donation records ──────────────────────────────────
        if ($type === 'All' || $type === 'Financial') {
            $query = FinancialDonationRecord::where('user_id', $userId);
            $query = $this->applyDateFilter($query, 'created_at', $range, $from, $to);

            $rows = $rows->merge(
                $query->get()->map(fn ($r) => [
                    'id'           => 'fin-' . $r->id,
                    'date'         => $r->donated_at
                                        ? $r->donated_at->format('M d, Y')
                                        : $r->created_at->format('M d, Y'),
                    'type'         => 'Financial',
                    'amount_items' => '₱ ' . number_format($r->amount, 0),
                    'status'       => ucfirst($r->status),    // Pending | Approved | Rejected
                    'raw_date'     => $r->created_at,
                ])
            );
        }

        // ── Food donation records ────────────────────────────────────────
        if ($type === 'All' || $type === 'Food') {
            $query = FoodDonationRecord::with('items')
                ->where('user_id', $userId);
            $query = $this->applyDateFilter($query, 'created_at', $range, $from, $to);

            $rows = $rows->merge(
                $query->get()->map(function ($r) {
                    // Summarize items: "3 items" or first item name if only 1
                    $itemCount = $r->items->count();
                    $summary   = $itemCount === 1
                        ? $r->items->first()->food_name
                        : "{$itemCount} food items";

                    return [
                        'id'           => 'food-' . $r->id,
                        'date'         => $r->created_at->format('M d, Y'),
                        'type'         => 'Food',
                        'amount_items' => $summary,
                        'status'       => ucfirst($r->status),
                        'raw_date'     => $r->created_at,
                    ];
                })
            );
        }

        // Sort all rows by date descending
        $sorted = $rows->sortByDesc('raw_date')->values()->map(function ($row) {
            unset($row['raw_date']);
            return $row;
        });

        return response()->json($sorted);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /donor/profile
    // ══════════════════════════════════════════════════════════════════
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    // ── Private helper: apply date range filter ─────────────────────
    private function applyDateFilter($query, string $col, string $range, ?string $from, ?string $to)
    {
        switch ($range) {
            case 'this_week':
                $query->whereBetween($col, [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth($col, now()->month)->whereYear($col, now()->year);
                break;
            case 'this_year':
                $query->whereYear($col, now()->year);
                break;
            case 'custom':
                if ($from) $query->whereDate($col, '>=', $from);
                if ($to)   $query->whereDate($col, '<=', $to);
                break;
            // 'all_time' → no filter
        }
        return $query;
    }
}
