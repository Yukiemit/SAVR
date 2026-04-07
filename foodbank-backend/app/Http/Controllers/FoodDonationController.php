<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FoodDonation;
use App\Models\FoodDonationItem;
use App\Models\FoodDonationRecord;
use App\Models\FoodDonationRecordItem;

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

        return response()->json(['message' => 'Donation record rejected.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Stats for badge counts
    // ══════════════════════════════════════════════════════════════════
    public function getRecordStats()
    {
        return response()->json([
            'pending'  => FoodDonationRecord::where('status', 'pending')->count(),
            'approved' => FoodDonationRecord::where('status', 'approved')->count(),
            'rejected' => FoodDonationRecord::where('status', 'rejected')->count(),
        ]);
    }
}
