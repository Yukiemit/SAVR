<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ServiceDonation;
use App\Models\ServiceDonationRecord;

class ServiceDonationController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // DONOR — Submit a service donation
    // POST /api/donor/donations/service
    // ══════════════════════════════════════════════════════════════════
    public function store(Request $request)
    {
        $request->validate([
            'service_type' => 'required|string|max:100',
            'quantity'     => 'required|integer|min:1',
            'frequency'    => 'required|in:Monthly,Weekly,Daily,One-Time',
            'date'         => 'nullable|date',
            'day_of_week'  => 'nullable|string|max:20',
            'all_day'      => 'boolean',
            'starts_at'    => 'nullable|date_format:H:i',
            'ends_at'      => 'nullable|date_format:H:i|after:starts_at',
            'address'      => 'required|string|max:500',
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'required|string|max:100',
            'email'        => 'required|email|max:200',
            'notes'        => 'nullable|string|max:2000',
        ]);

        $record = ServiceDonationRecord::create([
            'user_id'      => $request->user()->id,
            'service_type' => $request->service_type,
            'quantity'     => $request->quantity,
            'frequency'    => $request->frequency,
            'date'         => $request->date ?? null,
            'day_of_week'  => $request->day_of_week ?? null,
            'all_day'      => $request->boolean('all_day'),
            'starts_at'    => $request->all_day ? null : $request->starts_at,
            'ends_at'      => $request->all_day ? null : $request->ends_at,
            'address'      => $request->address,
            'first_name'   => $request->first_name,
            'last_name'    => $request->last_name,
            'email'        => $request->email,
            'notes'        => $request->notes ?? null,
            'status'       => 'pending',
        ]);

        return response()->json([
            'message' => 'Service donation submitted for staff review.',
            'record'  => $record,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════
    // DONOR — View own service donations
    // GET /api/donor/donations/service
    // ══════════════════════════════════════════════════════════════════
    public function index(Request $request)
    {
        $records = ServiceDonationRecord::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($records);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — List all service donation records
    // GET /api/staff/service-donation-records
    // ══════════════════════════════════════════════════════════════════
    public function getRecords(Request $request)
    {
        $query = ServiceDonationRecord::with('user')
            ->orderByDesc('created_at');

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('service_type', 'like', "%{$search}%")
                  ->orWhere('first_name',   'like', "%{$search}%")
                  ->orWhere('last_name',    'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Approve a service donation record
    //         → copies to service_donations (confirmed table)
    // POST /api/staff/service-donation-records/{id}/approve
    // ══════════════════════════════════════════════════════════════════
    public function approveRecord(Request $request, $id)
    {
        $record = ServiceDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        // Copy to the confirmed service_donations table
        ServiceDonation::create([
            'service_donation_record_id' => $record->id,
            'user_id'                    => $record->user_id,
            'service_type'               => $record->service_type,
            'quantity'                   => $record->quantity,
            'frequency'                  => $record->frequency,
            'date'                       => $record->date,
            'day_of_week'                => $record->day_of_week,
            'all_day'                    => $record->all_day,
            'starts_at'                  => $record->starts_at,
            'ends_at'                    => $record->ends_at,
            'address'                    => $record->address,
            'first_name'                 => $record->first_name,
            'last_name'                  => $record->last_name,
            'email'                      => $record->email,
            'notes'                      => $record->notes,
            'staff_notes'                => $request->notes ?? null,
        ]);

        // Mark the record as approved
        $record->update([
            'status'      => 'approved',
            'staff_notes' => $request->notes ?? null,
        ]);

        return response()->json(['message' => 'Service donation approved and confirmed.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Reject a service donation record
    // POST /api/staff/service-donation-records/{id}/reject
    // ══════════════════════════════════════════════════════════════════
    public function rejectRecord(Request $request, $id)
    {
        $record = ServiceDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        $record->update([
            'status'      => 'rejected',
            'staff_notes' => $request->notes ?? null,
        ]);

        return response()->json(['message' => 'Service donation rejected.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Stats
    // GET /api/staff/service-donation-records/stats
    // ══════════════════════════════════════════════════════════════════
    public function getRecordStats()
    {
        return response()->json([
            'pending'  => ServiceDonationRecord::where('status', 'pending')->count(),
            'approved' => ServiceDonationRecord::where('status', 'approved')->count(),
            'rejected' => ServiceDonationRecord::where('status', 'rejected')->count(),
        ]);
    }
}
