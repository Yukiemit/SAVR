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
        $isTransport = $request->service_tab === 'Transportation';

        // ── Shared validation ─────────────────────────────────────────
        $rules = [
            'service_tab' => 'required|in:Transportation,Volunteer Work',
            'frequency'   => 'required|in:Monthly,Weekly,Daily,One-Time',
            'date'        => 'nullable|string|max:50',
            'all_day'     => 'boolean',
            'starts_at'   => 'nullable|date_format:H:i',
            'ends_at'     => 'nullable|date_format:H:i',
            'address'     => 'required|string|max:500',
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'email'       => 'required|email|max:200',
            'notes'       => 'nullable|string|max:2000',
        ];

        // ── Transportation-specific validation ────────────────────────
        if ($isTransport) {
            $rules = array_merge($rules, [
                'quantity'             => 'required|integer|min:1',
                'vehicle_type'         => 'required|string|max:100',
                'capacity'             => 'required|integer|min:1',
                'max_distance'         => 'required|integer|min:1',
                'transport_categories' => 'nullable|array',
                'transport_categories.*' => 'string|max:100',
            ]);
        }

        // ── Volunteer Work-specific validation ────────────────────────
        if (!$isTransport) {
            $rules = array_merge($rules, [
                'headcount'          => 'required|integer|min:1',
                'preferred_work'     => 'required|string|max:100',
                'skill_categories'   => 'nullable|array',
                'skill_categories.*' => 'string|max:100',
            ]);
        }

        $request->validate($rules);

        // ── Resolve date / day_of_week from the single `date` field ──
        // Frontend sends:
        //   Weekly → date = "Saturday" (day name)
        //   Daily  → date = null
        //   Monthly/One-Time → date = "YYYY-MM-DD"
        $dayOfWeek = null;
        $date      = null;

        if ($request->frequency === 'Weekly') {
            $dayOfWeek = $request->date;   // e.g. "Saturday"
        } elseif ($request->frequency !== 'Daily') {
            $date = $request->date;         // actual date string
        }

        // ── Build record payload ──────────────────────────────────────
        $payload = [
            'user_id'     => $request->user()->id,
            'service_tab' => $request->service_tab,
            'frequency'    => $request->frequency,
            'date'         => $date,
            'day_of_week'  => $dayOfWeek,
            'all_day'      => $request->boolean('all_day'),
            'starts_at'    => $request->boolean('all_day') ? null : $request->starts_at,
            'ends_at'      => $request->boolean('all_day') ? null : $request->ends_at,
            'address'      => $request->address,
            'first_name'   => $request->first_name,
            'last_name'    => $request->last_name,
            'email'        => $request->email,
            'notes'        => $request->notes ?? null,
            'status'       => 'pending',
        ];

        // ── Merge type-specific fields ────────────────────────────────
        if ($isTransport) {
            $payload = array_merge($payload, [
                'quantity'             => $request->quantity,
                'vehicle_type'         => $request->vehicle_type,
                'capacity'             => $request->capacity,
                'max_distance'         => $request->max_distance,
                'transport_categories' => $request->transport_categories ?? [],
            ]);
        } else {
            $payload = array_merge($payload, [
                'headcount'       => $request->headcount,
                'preferred_work'  => $request->preferred_work,
                'skill_categories' => $request->skill_categories ?? [],
            ]);
        }

        $record = ServiceDonationRecord::create($payload);

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
    // STAFF — List all pending service donation records
    // GET /api/staff/service-donations
    // ══════════════════════════════════════════════════════════════════
    public function getRecords(Request $request)
    {
        $query = ServiceDonationRecord::with('user')
            ->orderByDesc('created_at');

        // Filter by status tab (all / pending / accepted / declined)
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by service type tab
        if ($request->service_tab && $request->service_tab !== 'all') {
            $query->where('service_tab', $request->service_tab);
        }

        // Search by donor name, address, email, service tab
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhere('service_tab', 'like', "%{$search}%")
                ->orWhere('address',     'like', "%{$search}%")
                ->orWhere('first_name',  'like', "%{$search}%")
                ->orWhere('last_name',   'like', "%{$search}%");
            });
        }

        $records = $query->get()->map(function ($r) {
            return [
                'id'                   => $r->id,
                'donor_name'           => $r->user?->name ?? "{$r->first_name} {$r->last_name}",
                'service_tab'          => $r->service_tab,
                'address'              => $r->address,
                'frequency'            => $r->frequency,
                'date'                 => $r->day_of_week ?? $r->date,
                'all_day'              => $r->all_day,
                'starts_at'            => $r->starts_at,
                'ends_at'              => $r->ends_at,

                // Transportation
                'quantity'             => $r->quantity,
                'vehicle_type'         => $r->vehicle_type,
                'capacity'             => $r->capacity,
                'max_distance'         => $r->max_distance,
                'transport_categories' => $r->transport_categories ?? [],

                // Volunteer Work
                'headcount'            => $r->headcount,
                'preferred_work'       => $r->preferred_work,
                'skill_categories'     => $r->skill_categories ?? [],

                // Contact
                'first_name'           => $r->first_name,
                'last_name'            => $r->last_name,
                'email'                => $r->email,
                'notes'                => $r->notes,

                'status'               => $r->status,
                'staff_notes'          => $r->staff_notes,
                'created_at'           => $r->created_at,
            ];
        });

        return response()->json($records);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Stats
    // GET /api/staff/service-donations/stats
    // ══════════════════════════════════════════════════════════════════
    public function getRecordStats()
    {
        return response()->json([
            'pending'  => ServiceDonationRecord::where('status', 'pending')->count(),
            'accepted' => ServiceDonationRecord::where('status', 'accepted')->count(),
            'declined' => ServiceDonationRecord::where('status', 'declined')->count(),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Accept a service donation
    //         → copies to service_donations (confirmed table)
    // POST /api/staff/service-donations/{id}/accept
    // ══════════════════════════════════════════════════════════════════
    public function acceptRecord(Request $request, $id)
    {
        $record = ServiceDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        // Copy all fields to the confirmed service_donations table
        ServiceDonation::create([
            'service_donation_record_id' => $record->id,
            'user_id'                    => $record->user_id,
            'service_tab'                => $record->service_tab,
            'frequency'                  => $record->frequency,
            'date'                       => $record->date,
            'day_of_week'                => $record->day_of_week,
            'all_day'                    => $record->all_day,
            'starts_at'                  => $record->starts_at,
            'ends_at'                    => $record->ends_at,
            'address'                    => $record->address,

            // Transportation
            'quantity'             => $record->quantity,
            'vehicle_type'         => $record->vehicle_type,
            'capacity'             => $record->capacity,
            'max_distance'         => $record->max_distance,
            'transport_categories' => $record->transport_categories,

            // Volunteer Work
            'headcount'            => $record->headcount,
            'preferred_work'       => $record->preferred_work,
            'skill_categories'     => $record->skill_categories,

            // Contact
            'first_name'           => $record->first_name,
            'last_name'            => $record->last_name,
            'email'                => $record->email,
            'notes'                => $record->notes,
            'staff_notes'          => $request->notes ?? null,
        ]);

        $record->update([
            'status'      => 'accepted',
            'staff_notes' => $request->notes ?? null,
        ]);

        return response()->json(['message' => 'Service donation accepted.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // STAFF — Decline a service donation
    // POST /api/staff/service-donations/{id}/decline
    // ══════════════════════════════════════════════════════════════════
    public function declineRecord(Request $request, $id)
    {
        $record = ServiceDonationRecord::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Record is no longer pending.'], 422);
        }

        $record->update([
            'status'      => 'declined',
            'staff_notes' => $request->notes ?? null,
        ]);

        return response()->json(['message' => 'Service donation declined.']);
    }
}
