<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\FoodDonation;
use App\Models\FoodDonationItem;
use App\Models\FoodDonationRecord;
use App\Models\FoodDonationRecordItem;
use App\Models\FoodInventory;
use App\Models\TruckStop;

class FoodDonationController extends Controller
{
    // Fixed delivery drop-off address
    const DELIVERY_ADDRESS = 'Room 300, DHI Building, No. 2 Lapu Lapu Avenue, Magallanes, Makati City 1232, Metro Manila, Philippines';

    // ══════════════════════════════════════════════════════════════════
    // DONOR — Submit a food donation → goes to food_donation_records
    //         (pending staff approval before reaching inventory)
    // ══════════════════════════════════════════════════════════════════
    public function store(Request $request)
    {
        $request->validate([
            'mode'            => 'required|in:pickup,delivery',
            'preferred_date'  => 'required|date|after_or_equal:today',
            'time_slot_start' => 'required',
            'time_slot_end'   => 'required|after:time_slot_start',
            'items'           => 'required|string',
            'pickup_address'  => 'required_if:mode,pickup|nullable|string',
        ]);

        $items = json_decode($request->items, true);
        if (!$items || !is_array($items) || count($items) === 0) {
            return response()->json(['message' => 'At least one food item is required.'], 422);
        }

        // Save to donation RECORDS table (awaiting staff review)
        $record = FoodDonationRecord::create([
            'user_id'          => $request->user()->id,
            'mode'             => $request->mode,
            'pickup_address'   => $request->mode === 'pickup' ? $request->pickup_address : null,
            'pickup_lat'       => $request->mode === 'pickup' ? $request->pickup_lat : null,
            'pickup_lng'       => $request->mode === 'pickup' ? $request->pickup_lng : null,
            'delivery_address' => $request->mode === 'delivery' ? self::DELIVERY_ADDRESS : null,
            'preferred_date'   => $request->preferred_date,
            'time_slot_start'  => $request->time_slot_start,
            'time_slot_end'    => $request->time_slot_end,
            'status'           => 'pending',
        ]);

        // Save each food item to record items table
        foreach ($items as $idx => $item) {
            $photoPath = null;
            $photoKey  = "photo_{$idx}";

            if ($request->hasFile($photoKey)) {
                $photoPath = $request->file($photoKey)->store("donation-records/food/{$record->id}", 'public');
            }

            FoodDonationRecordItem::create([
                'food_donation_record_id' => $record->id,
                'food_name'               => $item['food_name'],
                'quantity'                => $item['quantity'],
                'unit'                    => $item['unit'],
                'category'                => $item['category'],
                'expiration_date'         => $item['expiration_date'],
                'special_notes'           => $item['special_notes'] ?? null,
                'photo_path'              => $photoPath,
            ]);
        }

        return response()->json([
            'message' => 'Donation submitted for staff review.',
            'record'  => $record->load('items'),
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════
    // DONOR — View own donation records
    // ══════════════════════════════════════════════════════════════════
    public function index(Request $request)
    {
        $records = FoodDonationRecord::with('items')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($records);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — List all pending (and all) food donation records
    // ══════════════════════════════════════════════════════════════════
    public function getRecords(Request $request)
    {
        $query = FoodDonationRecord::with(['items', 'user'])
            ->orderByDesc('created_at');

        // Optional status filter: ?status=pending
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Optional search by donor name or address
        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            })->orWhere('pickup_address', 'like', "%{$request->search}%");
        }

        return response()->json($query->get());
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Approve a record → move to food_donations (inventory)
    // ══════════════════════════════════════════════════════════════════
    public function approveRecord(Request $request, $id)
    {
        $record = FoodDonationRecord::with('items')->findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        // Create the approved donation in the inventory table
        $donation = FoodDonation::create([
            'user_id'          => $record->user_id,
            'mode'             => $record->mode,
            'pickup_address'   => $record->pickup_address,
            'pickup_lat'       => $record->pickup_lat,
            'pickup_lng'       => $record->pickup_lng,
            'delivery_address' => $record->delivery_address,
            'preferred_date'   => $record->preferred_date,
            'time_slot_start'  => $record->time_slot_start,
            'time_slot_end'    => $record->time_slot_end,
            'status'           => 'confirmed',
            'notes'            => $request->notes ?? null,
        ]);

        // Copy each item to the inventory items table
        foreach ($record->items as $item) {
            FoodDonationItem::create([
                'food_donation_id' => $donation->id,
                'food_name'        => $item->food_name,
                'quantity'         => $item->quantity,
                'unit'             => $item->unit,
                'category'         => $item->category,
                'expiration_date'  => $item->expiration_date,
                'special_notes'    => $item->special_notes,
                'photo_path'       => $item->photo_path,
            ]);
        }

        // Mark the record as approved
        $record->update([
            'status'      => 'approved',
            'staff_notes' => $request->notes ?? null,
        ]);

        Cache::forget('food_donation_record_stats');
        Cache::forget('staff_dashboard_stats');

        return response()->json([
            'message'  => 'Donation approved and added to inventory.',
            'donation' => $donation->load('items'),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Reject a record
    // ══════════════════════════════════════════════════════════════════
    public function rejectRecord(Request $request, $id)
    {
        $record = FoodDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        $record->update([
            'status'      => 'rejected',
            'staff_notes' => $request->notes ?? null,
        ]);

        Cache::forget('food_donation_record_stats');

        return response()->json(['message' => 'Donation record rejected.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Stats for badge counts
    // ══════════════════════════════════════════════════════════════════
    public function getRecordStats()
    {
        $stats = Cache::remember('food_donation_record_stats', 15, fn() => [
            'pending'  => FoodDonationRecord::where('status', 'pending')->count(),
            'approved' => FoodDonationRecord::where('status', 'approved')->count(),
            'rejected' => FoodDonationRecord::where('status', 'rejected')->count(),
        ]);
        return response()->json($stats);
    }

    // ══════════════════════════════════════════════════════════════════
    // DJT — FROM DONOR
    // ══════════════════════════════════════════════════════════════════

    /**
     * GET /staff/donations/journey/from-donor
     * Returns all food donation records shaped for the DJT "From Donor" view.
     * Status map:
     *   pending  → awaiting_accept  (For Approval)
     *   accepted → awaiting_transit (In Transit)
     *   received → completed
     *   rejected → cancelled
     *   approved → completed (legacy)
     */
    public function getDonorJourney()
    {
        $records = FoodDonationRecord::with(['items', 'user'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($records->map(function ($r) {
            $status = $r->status;

            // Map to DJT overall_status
            $overallStatus = match ($status) {
                'pending'  => 'pending',
                'accepted' => 'pending',   // still "pending" overall but transit stage is active
                'received' => 'completed',
                'approved' => 'completed', // legacy
                'rejected' => 'cancelled',
                default    => 'pending',
            };

            // Safely read timestamps — columns may not exist if migration hasn't run
            $acceptedAt = null;
            $receivedAt = null;
            try {
                $acceptedAt = $r->accepted_at?->toISOString();
                $receivedAt = $r->received_at?->toISOString();
            } catch (\Exception $e) {
                // Columns not yet migrated — use updated_at as fallback
                if ($status === 'accepted') {
                    $acceptedAt = $r->updated_at?->toISOString();
                } elseif ($status === 'received') {
                    $receivedAt = $r->updated_at?->toISOString();
                }
            }

            // Build stages
            $stages = [
                'preparing' => [
                    'timestamp' => $acceptedAt,
                    'status'    => match ($status) {
                        'pending'  => 'awaiting_accept',
                        'rejected' => 'cancelled',
                        default    => 'done',
                    },
                ],
                'transit' => [
                    'timestamp' => $receivedAt ?? $acceptedAt,
                    'status'    => match ($status) {
                        'pending'  => 'pending',
                        'accepted' => 'awaiting_transit',
                        'received' => 'done',
                        'approved' => 'done',
                        'rejected' => 'cancelled',
                        default    => 'pending',
                    },
                ],
                'received' => [
                    'timestamp' => $receivedAt,
                    'status'    => in_array($status, ['received', 'approved']) ? 'done' : 'pending',
                ],
            ];

            $addressLine = $r->mode === 'pickup'
                ? $r->pickup_address
                : $r->delivery_address;

            return [
                'id'              => $r->id,
                'donor_name'      => trim(($r->user?->first_name ?? '') . ' ' . ($r->user?->last_name ?? '')) ?: ($r->user?->name ?? 'Unknown Donor'),
                'overall_status'  => $overallStatus,
                'mode'            => $r->mode,
                'pickup_address'  => $addressLine,
                'preferred_date'  => $r->preferred_date,
                'time_slot_start' => $r->time_slot_start,
                'time_slot_end'   => $r->time_slot_end,
                'stages'          => $stages,
                'items'           => $r->items->map(fn($it) => [
                    'id'              => $it->id,
                    'food_name'       => $it->food_name,
                    'quantity'        => $it->quantity,
                    'unit'            => $it->unit,
                    'category'        => $it->category,
                    'expiration_date' => $it->expiration_date,
                    'special_notes'   => $it->special_notes,
                    'photo_url'       => $it->photo_path
                        ? asset("storage/{$it->photo_path}")
                        : null,
                ]),
            ];
        }));
    }

    /**
     * POST /staff/donations/journey/from-donor/{id}/accept
     * Staff accepts the donation — moves to "In Transit" stage.
     * Records accepted_at timestamp. Does NOT touch inventory yet.
     * Also creates a PICKUP truck_stop for truck optimization.
     */
    public function acceptDonorJourney($id)
    {
        $record = FoodDonationRecord::with('items')->findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Donation is not pending.'], 422);
        }

        $now = now();

        $record->update([
            'status'      => 'accepted',
            'accepted_at' => $now,
        ]);

        // Auto-create a PICKUP truck stop if one doesn't exist
        $existingStop = TruckStop::where('source', 'food_donation')
            ->where('reference_id', $record->id)
            ->first();

        if (!$existingStop) {
            TruckStop::create([
                'truck_id'        => null,  // unassigned
                'stop_type'       => 'PICKUP',
                'name'            => $record->user?->name ?? 'Unknown Donor',
                'address'         => $record->mode === 'pickup' ? $record->pickup_address : $record->delivery_address,
                'date'            => $record->preferred_date,
                'time_slot_start' => $record->time_slot_start,
                'time_slot_end'   => $record->time_slot_end,
                'food_items'      => $record->items->map(fn($i) => "{$i->food_name} | {$i->quantity} {$i->unit} | {$i->category}")->join(' · '),
                'food_name'       => $record->items->first()?->food_name,
                'food_type'       => $record->items->first()?->category,
                'qty'             => (string)($record->items->first()?->quantity),
                'unit'            => $record->items->first()?->unit,
                'source'          => 'food_donation',
                'reference_id'    => $record->id,
                'status'          => 'pending',
            ]);
        }

        Cache::forget('food_donation_record_stats');

        return response()->json([
            'message'     => 'Donation accepted. Now in transit.',
            'accepted_at' => $now->toISOString(),
        ]);
    }

    /**
     * POST /staff/donations/journey/from-donor/{id}/received
     * Staff confirms donation received — items go to food_inventory.
     * Records received_at timestamp.
     */
    public function receivedDonorJourney($id)
    {
        $record = FoodDonationRecord::with('items', 'user')->findOrFail($id);

        if ($record->status !== 'accepted') {
            return response()->json(['message' => 'Donation is not in transit.'], 422);
        }

        $now = now();

        // Add each donated item to the food_inventory table
        foreach ($record->items as $item) {
            FoodInventory::create([
                'food_name'       => $item->food_name,
                'category'        => $item->category,
                'quantity'        => (int) round((float) $item->quantity), // cast decimal → integer for food_inventory
                'unit'            => $item->unit,
                'expiration_date' => $item->expiration_date,
                'meal_type'       => 'Raw Ingredients',
                'special_notes'   => $item->special_notes,
            ]);
        }

        $record->update([
            'status'      => 'received',
            'received_at' => $now,
        ]);

        Cache::forget('food_donation_record_stats');
        Cache::forget('food_inventory_list');
        Cache::forget('staff_dashboard_stats');

        return response()->json([
            'message'     => 'Donation received. Items added to food inventory.',
            'received_at' => $now->toISOString(),
        ]);
    }

    /**
     * POST /staff/donations/journey/from-donor/{id}/decline
     * Permanently deletes the donation record from the database.
     */
    public function declineDonorJourney($id)
    {
        $record = FoodDonationRecord::with('items')->findOrFail($id);

        if (!in_array($record->status, ['pending', 'accepted'])) {
            return response()->json(['message' => 'Donation cannot be declined at this stage.'], 422);
        }

        // Hard delete — removes record and its items (cascade)
        $record->items()->delete();
        $record->delete();

        return response()->json(['message' => 'Donation declined and removed.']);
    }

    /**
     * POST /staff/donations/journey/from-donor/{id}/cancel-transit
     * Cancels an in-transit donation — permanently deletes from database.
     */
    public function cancelDonorJourney($id)
    {
        $record = FoodDonationRecord::with('items')->findOrFail($id);

        if ($record->status !== 'accepted') {
            return response()->json(['message' => 'Donation is not in transit.'], 422);
        }

        // Hard delete — removes record and its items (cascade)
        $record->items()->delete();
        $record->delete();

        return response()->json(['message' => 'Transit cancelled and record removed.']);
    }
}
