<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DonationRequest;
use App\Models\DonationDrive;

class DonationController extends Controller
{
    // ═══════════════════════════════════════════════════
    // DONATION REQUESTS
    // ═══════════════════════════════════════════════════

public function submitRequest(Request $request)
{
    $request->validate([
        'name'    => 'required|string',
        'email'   => 'required|email',
        'contact' => 'required|string',
        'address' => 'required|string',
        'urgency' => 'required|in:low,medium,high,critical', // ✅ fixed
        'pax'     => 'nullable|integer',
        'reason'  => 'nullable|string',
    ]);

    $donationRequest = DonationRequest::create($request->all());

    return response()->json([
        'message' => 'Request submitted successfully.',
        'data'    => $donationRequest,
    ], 201);
}

// ✅ STAFF — Get all donation requests (no urgency filter, React handles it)
public function getRequests(Request $request)
{
    $query = DonationRequest::orderBy('created_at', 'desc');

    if ($request->search) {
        $query->where(function ($q) use ($request) {
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('email', 'like', "%{$request->search}%")
              ->orWhere('address', 'like', "%{$request->search}%");
        });
    }

    return response()->json($query->get());
}

    // ✅ STAFF — Allocate a request → creates a donation drive entry
    public function allocateRequest(Request $request, $id)
    {
        $request->validate([
            'drive_title' => 'required|string',
            'type'        => 'required|in:Food,Financial',
            'goal'        => 'required|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
        ]);

        $donationRequest = DonationRequest::findOrFail($id);

        // ✅ CREATE DRIVE — auto-fill contact info from request, staff fills the rest
        $drive = DonationDrive::create([
            'donation_request_id' => $donationRequest->id,
            'staff_id'            => auth()->id(),
            'drive_title'         => $request->drive_title,
            'type'                => $request->type,
            'goal'                => $request->goal,
            'start_date'          => $request->start_date,
            'end_date'            => $request->end_date,

            // ── AUTO-FILLED FROM REQUEST ──
            'address'             => $donationRequest->address,
            'contact_person'      => $donationRequest->name,
            'contact'             => $donationRequest->contact,
            'email'               => $donationRequest->email,

            'status'              => 'Pending',
        ]);

        // ✅ MARK REQUEST AS ALLOCATED
        $donationRequest->update(['status' => 'Allocated']);

        return response()->json([
            'message' => 'Request allocated and drive created.',
            'drive'   => $drive,
        ]);
    }

    // ✅ STAFF — Unallocate a request → removes the drive, resets request to Pending
    public function unallocateRequest($id)
    {
        $donationRequest = DonationRequest::findOrFail($id);
        DonationDrive::where('donation_request_id', $id)->delete();
        $donationRequest->update(['status' => 'Pending']);

        return response()->json(['message' => 'Request unallocated.']);
    }

    // ✅ STAFF — Decline a request
    public function declineRequest($id)
    {
        $donationRequest = DonationRequest::findOrFail($id);
        $donationRequest->update(['status' => 'Declined']);

        return response()->json(['message' => 'Request declined.']);
    }

    // ✅ STAFF — Mark request as Done
    public function doneRequest($id)
    {
        $donationRequest = DonationRequest::findOrFail($id);
        $donationRequest->update(['status' => 'Done']);

        return response()->json(['message' => 'Request marked as done.']);
    }

    // ═══════════════════════════════════════════════════
    // DONATION DRIVES
    // ═══════════════════════════════════════════════════

    // ✅ STAFF — Get all donation drives with optional filter/search
    public function getDrives(Request $request)
    {
        $query = DonationDrive::with('request')->orderBy('created_at', 'desc');

        if ($request->filter && $request->filter !== 'All') {
            $query->where('status', $request->filter);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('drive_title', 'like', "%{$request->search}%")
                  ->orWhere('address', 'like', "%{$request->search}%")
                  ->orWhere('contact_person', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->get());
    }

    // ✅ STAFF — Manually create a new donation drive (without a request)
    public function createDrive(Request $request)
    {
        $request->validate([
            'drive_title'    => 'required|string',
            'type'           => 'required|in:Food,Financial',
            'goal'           => 'required|string',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            'address'        => 'nullable|string',
            'contact_person' => 'nullable|string',
            'contact'        => 'nullable|string',
            'email'          => 'nullable|email',
        ]);

        $drive = DonationDrive::create([
            ...$request->all(),
            'staff_id' => auth()->id(),
            'status'   => 'Pending',
        ]);

        return response()->json([
            'message' => 'Donation drive created.',
            'drive'   => $drive,
        ], 201);
    }

    // ✅ STAFF — Edit an existing donation drive
    public function updateDrive(Request $request, $id)
    {
        $request->validate([
            'drive_title'    => 'sometimes|string',
            'type'           => 'sometimes|in:Food,Financial',
            'goal'           => 'sometimes|string',
            'start_date'     => 'sometimes|date',
            'end_date'       => 'sometimes|date',
            'address'        => 'sometimes|string',
            'contact_person' => 'sometimes|string',
            'contact'        => 'sometimes|string',
            'email'          => 'sometimes|email',
            'status'         => 'sometimes|in:Pending,OnGoing,Done,Cancelled',
        ]);

        $drive = DonationDrive::findOrFail($id);
        $drive->update($request->all());

        return response()->json([
            'message' => 'Donation drive updated.',
            'drive'   => $drive,
        ]);
    }

    // ✅ STAFF — Delete a donation drive
    public function deleteDrive($id)
    {
        $drive = DonationDrive::findOrFail($id);
        $drive->delete();

        return response()->json(['message' => 'Donation drive deleted.']);
    }

    // ✅ STAFF — Get request + drive counts for badges
    public function getRequestStats()
    {
        return response()->json([
            'pending'   => DonationRequest::where('status', 'Pending')->count(),
            'allocated' => DonationRequest::where('status', 'Allocated')->count(),
        ]);
    }

    public function getDriveStats()
    {
        return response()->json([
            'pending'  => DonationDrive::where('status', 'Pending')->count(),
            'ongoing'  => DonationDrive::where('status', 'OnGoing')->count(),
        ]);
    }
}