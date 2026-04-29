<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\DonationRequest;
use App\Models\DonationDrive;
use App\Models\DonationDriveItem;
use App\Models\BeneficiaryRequest;
use App\Models\FoodInventory;
use App\Models\DonationDelivery;
use App\Models\TruckStop;

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
            'urgency' => 'required|in:low,medium,high,critical',
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
            return response()->json($query->get());
        }

        $data = Cache::remember('donation_requests_list', 30, fn() => $query->get());
        return response()->json($data);
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

        $drive = DonationDrive::create([
            'donation_request_id' => $donationRequest->id,
            'staff_id'            => auth()->id(),
            'drive_title'         => $request->drive_title,
            'type'                => $request->type,
            'goal'                => $request->goal,
            'start_date'          => $request->start_date,
            'end_date'            => $request->end_date,
            'address'             => $donationRequest->address,
            'contact_person'      => $donationRequest->name,
            'contact'             => $donationRequest->contact,
            'email'               => $donationRequest->email,
            'status'              => 'Pending',
        ]);

        $donationRequest->update(['status' => 'Allocated']);
        Cache::forget('donation_requests_list');
        Cache::forget('donation_request_stats');

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
        Cache::forget('donation_requests_list');
        Cache::forget('donation_request_stats');
        Cache::forget('donation_drives_list');

        return response()->json(['message' => 'Request unallocated.']);
    }

    // ✅ STAFF — Decline a request
    public function declineRequest($id)
    {
        $donationRequest = DonationRequest::findOrFail($id);
        $donationRequest->update(['status' => 'Declined']);
        Cache::forget('donation_requests_list');
        Cache::forget('donation_request_stats');

        return response()->json(['message' => 'Request declined.']);
    }

    // ✅ STAFF — Mark request as Done
    public function doneRequest($id)
    {
        $donationRequest = DonationRequest::findOrFail($id);
        $donationRequest->update(['status' => 'Done']);
        Cache::forget('donation_requests_list');
        Cache::forget('donation_request_stats');

        return response()->json(['message' => 'Request marked as done.']);
    }

    // ═══════════════════════════════════════════════════
    // DONATION DRIVES
    // ═══════════════════════════════════════════════════

    // ✅ STAFF — Get all donation drives with optional filter/search
    public function getDrives(Request $request)
    {
        $hasFilter = ($request->filter && $request->filter !== 'All') || $request->search;

        $query = DonationDrive::with(['request', 'items', 'deliveries'])->orderBy('created_at', 'desc');

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

        $drives = $hasFilter
            ? $query->get()
            : Cache::remember('donation_drives_list', 30, fn() => $query->get());

        return response()->json($drives->map(function ($drive) {
            $data = $drive->toArray();

            // current_amount: sum of allocated_qty from drive items (updated when delivery is received)
            // Fallback: sum qty from all received delivery items if no drive items exist
            $fromItems = $drive->items->sum('allocated_qty');

            if ($fromItems > 0) {
                $data['current_amount'] = $fromItems;
            } else {
                // Sum quantities from received deliveries (for drives without explicit items)
                $fromDeliveries = $drive->deliveries
                    ->where('status', 'received')
                    ->sum(fn($d) => collect($d->delivery_items)->sum('qty'));
                $data['current_amount'] = $fromDeliveries;
            }

            // computed_goal: if drive has items, use sum of goal_qty (more reliable than goal string)
            // Frontend uses this to render the progress bar when goal string has no number
            $itemGoalTotal = $drive->items->sum('goal_qty');
            $data['computed_goal'] = $itemGoalTotal > 0 ? $itemGoalTotal : null;

            return $data;
        }));
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

        Cache::forget('donation_drives_list');
        Cache::forget('donation_drive_stats');

        return response()->json([
            'message' => 'Donation drive created.',
            'drive'   => $drive,
        ], 201);
    }

    // ✅ STAFF — Edit an existing donation drive
    // When status changes to "Done", cascade to the linked donation/beneficiary request
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
        $oldStatus = $drive->status;
        $newStatus = $request->input('status', $oldStatus);

        $drive->update($request->all());

        // ── CREATE TRUCK STOP when drive becomes "OnGoing" ──
        if ($newStatus === 'OnGoing' && $oldStatus !== 'OnGoing') {
            // Check if a truck stop already exists for this drive
            $existingStop = TruckStop::where('source', 'donation_drive')
                ->where('reference_id', $drive->id)
                ->first();

            if (!$existingStop) {
                TruckStop::create([
                    'truck_id'        => null,  // unassigned
                    'stop_type'       => 'DELIVER',
                    'name'            => $drive->drive_title,
                    'address'         => $drive->address,
                    'date'            => $drive->start_date,
                    'time_slot_start' => '09:00',
                    'time_slot_end'   => '17:00',
                    'food_items'      => '',
                    'source'          => 'donation_drive',
                    'reference_id'    => $drive->id,
                    'status'          => 'pending',
                ]);
            }
        }

        // ── CASCADE: when drive becomes "Done", remove its request from Allocated list ──
        if ($newStatus === 'Done' && $oldStatus !== 'Done') {
            if ($drive->donation_request_id) {
                DonationRequest::where('id', $drive->donation_request_id)
                    ->where('status', 'Allocated')
                    ->update(['status' => 'Done']);
            }
            if ($drive->beneficiary_request_id) {
                BeneficiaryRequest::where('id', $drive->beneficiary_request_id)
                    ->where('status', 'Allocated')
                    ->update(['status' => 'Done']);
            }
        }

        Cache::forget('donation_drives_list');
        Cache::forget('donation_drive_stats');
        Cache::forget('staff_dashboard_stats');

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
        Cache::forget('donation_drives_list');
        Cache::forget('donation_drive_stats');
        Cache::forget('staff_dashboard_stats');

        return response()->json(['message' => 'Donation drive deleted.']);
    }

    // ✅ STAFF — Get request + drive counts for badges
    public function getRequestStats()
    {
        $stats = Cache::remember('donation_request_stats', 15, fn() => [
            'pending'   => DonationRequest::where('status', 'Pending')->count(),
            'allocated' => DonationRequest::where('status', 'Allocated')->count(),
        ]);
        return response()->json($stats);
    }

    public function getDriveStats()
    {
        $stats = Cache::remember('donation_drive_stats', 15, fn() => [
            'pending'  => DonationDrive::where('status', 'Pending')->count(),
            'ongoing'  => DonationDrive::where('status', 'OnGoing')->count(),
        ]);
        return response()->json($stats);
    }

    // ═══════════════════════════════════════════════════
    // BENEFICIARY REQUESTS (from authenticated beneficiaries)
    // ═══════════════════════════════════════════════════

    // ✅ STAFF — Get all beneficiary requests
    public function getBeneficiaryRequests(Request $request)
    {
        $query = BeneficiaryRequest::with('user')->orderBy('created_at', 'desc');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('request_name', 'like', "%{$request->search}%")
                  ->orWhere('city',         'like', "%{$request->search}%")
                  ->orWhere('barangay',     'like', "%{$request->search}%");
            });
        }

        return response()->json($query->get()->map(function ($r) {
            return [
                'id'           => $r->id,
                'request_name' => $r->request_name,
                'type'         => $r->type,
                'food_type'    => $r->food_type,
                'quantity'     => $r->quantity,
                'unit'         => $r->unit,
                'amount'       => $r->amount,
                'population'   => $r->population,
                'age_min'      => $r->age_min,
                'age_max'      => $r->age_max,
                'address'      => "{$r->street}, Brgy. {$r->barangay}, {$r->city} {$r->zip_code}",
                'city'         => $r->city,
                'request_date' => $r->request_date,
                'urgency'      => $r->urgency,
                'status'       => $r->status,
                'contact_name' => $r->user?->name,
                'email'        => $r->user?->email,
                'created_at'   => $r->created_at,
            ];
        }));
    }

    // ✅ STAFF — Stats for beneficiary requests
    public function getBeneficiaryRequestStats()
    {
        $stats = Cache::remember('beneficiary_request_stats', 15, fn() => [
            'pending'   => BeneficiaryRequest::where('status', 'Pending')->count(),
            'allocated' => BeneficiaryRequest::where('status', 'Allocated')->count(),
        ]);
        return response()->json($stats);
    }

    // ✅ STAFF — Allocate a beneficiary request → creates donation drive + drive items
    public function allocateBeneficiaryRequest(Request $request, $id)
    {
        $request->validate([
            'drive_title'      => 'required|string',
            'goal'             => 'required|string',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'food_allocations' => 'nullable|array',
            'food_allocations.*.inventory_id' => 'nullable|integer',
            'food_allocations.*.qty'          => 'nullable|integer|min:0',
        ]);

        $benRequest = BeneficiaryRequest::with('user')->findOrFail($id);

        $drive = DonationDrive::create([
            'beneficiary_request_id' => $benRequest->id,
            'staff_id'               => auth()->id(),
            'drive_title'            => $request->drive_title,
            'type'                   => $benRequest->type === 'food' ? 'Food' : 'Financial',
            'goal'                   => $request->goal,
            'start_date'             => $request->start_date,
            'end_date'               => $request->end_date,
            'address'                => "{$benRequest->street}, Brgy. {$benRequest->barangay}, {$benRequest->city} {$benRequest->zip_code}",
            'contact_person'         => $benRequest->user?->name,
            'contact'                => null,
            'email'                  => $benRequest->user?->email,
            'status'                 => 'Pending',
        ]);

        // ── Create donation drive items from food allocations ──
        $foodAllocations = $request->input('food_allocations', []);
        foreach ($foodAllocations as $alloc) {
            if (empty($alloc['inventory_id']) || empty($alloc['qty']) || $alloc['qty'] <= 0) continue;

            $inv = FoodInventory::find($alloc['inventory_id']);
            if (!$inv) continue;

            DonationDriveItem::create([
                'donation_drive_id' => $drive->id,
                'food_inventory_id' => $inv->id,
                'food_name'         => $inv->food_name,
                'category'          => $inv->category,
                'goal_qty'          => $alloc['qty'],
                'allocated_qty'     => 0,
                'unit'              => $inv->unit,
                'expiration_date'   => $inv->expiration_date,
            ]);
        }

        $benRequest->update(['status' => 'Allocated']);

        return response()->json([
            'message' => 'Request allocated and donation drive created.',
            'drive'   => $drive->load('items'),
        ]);
    }

    // ✅ STAFF — Reject a beneficiary request
    public function rejectBeneficiaryRequest($id)
    {
        $benRequest = BeneficiaryRequest::findOrFail($id);
        $benRequest->update(['status' => 'Rejected']);

        return response()->json(['message' => 'Request rejected.']);
    }

    // ═══════════════════════════════════════════════════
    // FOOD INVENTORY
    // ═══════════════════════════════════════════════════

    // ✅ STAFF — Get all food inventory items
    // Used by both the inventory page AND the allocation panel
    public function getInventory(Request $request)
    {
        $shape = fn($item) => [
            'id'              => $item->id,
            'food_name'       => $item->food_name,
            'food_type'       => $item->category,
            'category'        => $item->category,
            'stock'           => $item->quantity,
            'quantity'        => $item->quantity,
            'unit'            => $item->unit,
            'expiration_date' => $item->expiration_date,
            'meal_type'       => $item->meal_type ?? 'Raw Ingredients',
            'special_notes'   => $item->special_notes,
        ];

        if ($request->search) {
            $items = FoodInventory::orderBy('expiration_date', 'asc')
                ->where(fn($q) => $q
                    ->where('food_name', 'like', "%{$request->search}%")
                    ->orWhere('category', 'like', "%{$request->search}%"))
                ->get();
            return response()->json($items->map($shape));
        }

        $data = Cache::remember('food_inventory_list', 30, fn() =>
            FoodInventory::orderBy('expiration_date', 'asc')->get()->map($shape)->values()
        );
        return response()->json($data);
    }

    // ✅ STAFF — Add a new food inventory item
    public function storeInventory(Request $request)
    {
        $request->validate([
            'food_name'       => 'required|string',
            'category'        => 'required|string',
            'unit'            => 'required|string',
            'quantity'        => 'required|integer|min:0',
            'expiration_date' => 'required|date',
            'meal_type'       => 'nullable|string',
            'special_notes'   => 'nullable|string',
        ]);

        $item = FoodInventory::create([
            'food_name'       => $request->food_name,
            'category'        => $request->category,
            'unit'            => $request->unit,
            'quantity'        => $request->quantity,
            'expiration_date' => $request->expiration_date,
            'meal_type'       => $request->meal_type ?? 'Raw Ingredients',
            'special_notes'   => $request->special_notes,
        ]);

        Cache::forget('food_inventory_list');

        return response()->json([
            'id'              => $item->id,
            'food_name'       => $item->food_name,
            'food_type'       => $item->category,
            'category'        => $item->category,
            'stock'           => $item->quantity,
            'quantity'        => $item->quantity,
            'unit'            => $item->unit,
            'expiration_date' => $item->expiration_date,
            'meal_type'       => $item->meal_type,
            'special_notes'   => $item->special_notes,
        ], 201);
    }

    // ✅ STAFF — Update a food inventory item
    public function updateInventory(Request $request, $id)
    {
        $request->validate([
            'food_name'       => 'sometimes|string',
            'category'        => 'sometimes|string',
            'unit'            => 'sometimes|string',
            'quantity'        => 'sometimes|integer|min:0',
            'expiration_date' => 'sometimes|date',
            'meal_type'       => 'nullable|string',
            'special_notes'   => 'nullable|string',
        ]);

        $item = FoodInventory::findOrFail($id);
        $item->update($request->only([
            'food_name', 'category', 'unit', 'quantity',
            'expiration_date', 'meal_type', 'special_notes',
        ]));

        Cache::forget('food_inventory_list');

        return response()->json([
            'id'              => $item->id,
            'food_name'       => $item->food_name,
            'food_type'       => $item->category,
            'category'        => $item->category,
            'stock'           => $item->quantity,
            'quantity'        => $item->quantity,
            'unit'            => $item->unit,
            'expiration_date' => $item->expiration_date,
            'meal_type'       => $item->meal_type,
            'special_notes'   => $item->special_notes,
        ]);
    }

    // ✅ STAFF — Delete a food inventory item
    public function destroyInventory($id)
    {
        FoodInventory::findOrFail($id)->delete();
        Cache::forget('food_inventory_list');
        return response()->json(['message' => 'Item deleted.']);
    }

    // ═══════════════════════════════════════════════════
    // DONATION JOURNEY TRACKER — TO BENEFICIARY
    // ═══════════════════════════════════════════════════

    /**
     * GET /staff/donations/journey/to-beneficiary
     *
     * Returns a flat mixed list of:
     *  - Drive records (for_approval, completed, cancelled)
     *  - Active delivery records (in_transit)
     *
     * Each entry has a `record_type` field: 'drive' | 'delivery'
     * Frontend uses record_type + overall_status to choose which card component to render.
     */
    public function getBeneficiaryJourney()
    {
        $drives = DonationDrive::with(['items', 'beneficiaryRequest.user', 'deliveries'])
            ->whereNotNull('beneficiary_request_id')
            ->orderBy('created_at', 'desc')
            ->get();

        $result = [];

        foreach ($drives as $drive) {
            $benReq = $drive->beneficiaryRequest;
            $beneficiaryName = $benReq?->request_name ?? $drive->contact_person;

            $driveStatusMap = [
                'Pending'   => 'for_approval',
                'OnGoing'   => 'completed', // fallback
                'Done'      => 'completed',
                'Cancelled' => 'cancelled',
            ];

            // allocated_qty = sum of quantities from RECEIVED deliveries (permanent progress)
            $driveItems = $drive->items->map(fn($item) => [
                'id'                => $item->id,
                'food_name'         => $item->food_name,
                'goal_qty'          => $item->goal_qty,
                'allocated_qty'     => $item->allocated_qty,
                'unit'              => $item->unit,
                'expiration_date'   => $item->expiration_date,
                'food_inventory_id' => $item->food_inventory_id,
            ]);

            // ── Use delivery timestamps (more accurate than drive-level fields) ──
            // For completed drives: use the most recent received delivery's received_at
            // For all drives: use the earliest delivery's prepared_at as the "preparing" time
            $receivedDeliveries = $drive->deliveries->where('status', 'received')->sortByDesc('received_at');
            $latestReceivedAt   = $receivedDeliveries->first()?->received_at;

            $allDeliveries     = $drive->deliveries->sortBy('prepared_at');
            $earliestPreparedAt = $allDeliveries->first()?->prepared_at;

            $result[] = [
                'record_type'      => 'drive',
                'id'               => $drive->id,
                'drive_title'      => $drive->drive_title,
                'beneficiary_name' => $beneficiaryName,
                'overall_status'   => $driveStatusMap[$drive->status] ?? 'for_approval',
                'address'          => $drive->address,
                'preferred_date'   => $drive->end_date,
                // Use delivery-level timestamps so they always match the actual button click time
                'prepared_at'      => $earliestPreparedAt ?? $drive->prepared_at,
                'received_at'      => $latestReceivedAt   ?? $drive->received_at,
                'items'            => $driveItems,
            ];

            // ── Delivery records (In Transit only — received/cancelled are absorbed) ─
            foreach ($drive->deliveries->where('status', 'in_transit') as $delivery) {
                // Normalize delivery_items to match drive item shape for the card
                $deliveryItems = collect($delivery->delivery_items)->map(fn($di) => [
                    'id'                => null,
                    'food_name'         => $di['food_name'],
                    'goal_qty'          => $di['goal_qty'] ?? null,
                    'allocated_qty'     => $di['qty'],  // the qty being delivered
                    'unit'              => $di['unit'] ?? '',
                    'expiration_date'   => $di['expiration_date'] ?? null,
                    'food_inventory_id' => $di['food_inventory_id'] ?? null,
                ]);

                $result[] = [
                    'record_type'      => 'delivery',
                    'id'               => $delivery->id,
                    'drive_id'         => $drive->id,
                    'drive_title'      => $drive->drive_title,
                    'beneficiary_name' => $beneficiaryName,
                    'overall_status'   => 'in_transit',
                    'address'          => $drive->address,
                    'preferred_date'   => $drive->end_date,
                    'prepared_at'      => $delivery->prepared_at,
                    'received_at'      => null,
                    'items'            => $deliveryItems,
                ];
            }
        }

        return response()->json($result);
    }

    /**
     * POST /staff/donations/journey/to-beneficiary/{driveId}/accept
     *
     * Staff inputs how many of each item they can deliver now.
     * Creates a new DonationDelivery record (status: in_transit).
     * Drive itself stays in Pending (For Approval) — progress only updates on Received.
     * Inventory is NOT deducted here.
     */
    public function acceptDriveJourney(Request $request, $id)
    {
        $request->validate([
            'allocations'           => 'required|array',
            'allocations.*.item_id' => 'required|integer',
            'allocations.*.qty'     => 'required|integer|min:0',
        ]);

        $drive = DonationDrive::with('items')->findOrFail($id);

        // Build delivery_items snapshot from the allocations
        $deliveryItems = [];
        foreach ($request->allocations as $alloc) {
            if (empty($alloc['qty']) || $alloc['qty'] <= 0) continue;

            $item = $drive->items->firstWhere('id', $alloc['item_id']);
            if (!$item) continue;

            // Cap at remaining (goal - already received)
            $remaining = $item->goal_qty - $item->allocated_qty;
            $qty       = min($alloc['qty'], max(0, $remaining));
            if ($qty <= 0) continue;

            $deliveryItems[] = [
                'drive_item_id'    => $item->id,
                'food_inventory_id'=> $item->food_inventory_id,
                'food_name'        => $item->food_name,
                'qty'              => $qty,
                'goal_qty'         => $item->goal_qty,
                'unit'             => $item->unit,
                'expiration_date'  => $item->expiration_date,
            ];
        }

        if (empty($deliveryItems)) {
            return response()->json(['message' => 'No valid quantities entered.'], 422);
        }

        // Create the delivery — status: in_transit
        $delivery = DonationDelivery::create([
            'donation_drive_id' => $drive->id,
            'status'            => 'in_transit',
            'delivery_items'    => $deliveryItems,
            'prepared_at'       => now(),
        ]);

        return response()->json([
            'message'  => 'Delivery created and now In Transit. Drive stays For Approval until goal is met.',
            'delivery' => $delivery,
        ]);
    }

    /**
     * POST /staff/donations/journey/to-beneficiary/{driveId}/decline
     *
     * Cancels the entire drive and any active deliveries.
     * Reverts beneficiary request to Pending.
     */
    public function declineDriveJourney($id)
    {
        $drive = DonationDrive::with('deliveries')->findOrFail($id);
        $drive->update(['status' => 'Cancelled']);

        // Cancel any in-transit deliveries for this drive
        $drive->deliveries()
            ->where('status', 'in_transit')
            ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        // Revert beneficiary request back to Pending so it can be re-allocated
        if ($drive->beneficiary_request_id) {
            BeneficiaryRequest::where('id', $drive->beneficiary_request_id)
                ->where('status', 'Allocated')
                ->update(['status' => 'Pending']);
        }

        return response()->json(['message' => 'Drive declined and cancelled.']);
    }

    /**
     * POST /staff/donations/journey/deliveries/{deliveryId}/received
     *
     * Staff marks a specific delivery as received.
     * - Deducts inventory for each item in the delivery
     * - Adds the delivery qty to donation_drive_items.allocated_qty
     * - If ALL drive item goals are now met → marks drive as Done
     */
    public function receivedDriveJourney($id)
    {
        $delivery = DonationDelivery::with('drive.items')->findOrFail($id);

        if ($delivery->status !== 'in_transit') {
            return response()->json(['message' => 'Delivery is not in transit.'], 422);
        }

        $drive = $delivery->drive;

        foreach ($delivery->delivery_items as $di) {
            $qty = $di['qty'] ?? 0;
            if ($qty <= 0) continue;

            // 1. Deduct from food inventory
            if (!empty($di['food_inventory_id'])) {
                FoodInventory::where('id', $di['food_inventory_id'])
                    ->where('quantity', '>=', $qty)
                    ->decrement('quantity', $qty);
            }

            // 2. Add to the drive item's allocated_qty (progress tracking)
            if (!empty($di['drive_item_id'])) {
                $driveItem = $drive->items->firstWhere('id', $di['drive_item_id']);
                if ($driveItem) {
                    $driveItem->increment('allocated_qty', $qty);
                }
            }
        }

        $now = now();

        // Mark delivery as received with the exact current timestamp
        $delivery->update(['status' => 'received', 'received_at' => $now]);

        // Reload drive items to check if all goals are now met
        $drive->load('items');
        $allMet = $drive->items->isNotEmpty() &&
                  $drive->items->every(fn($it) => $it->allocated_qty >= $it->goal_qty);

        if ($allMet && $drive->status === 'Pending') {
            // Use the exact same $now so drive.received_at === delivery.received_at
            $drive->update([
                'status'      => 'Done',
                'received_at' => $now,
            ]);

            // Cascade: mark beneficiary request as Done
            if ($drive->beneficiary_request_id) {
                BeneficiaryRequest::where('id', $drive->beneficiary_request_id)
                    ->where('status', 'Allocated')
                    ->update(['status' => 'Done']);
            }
        }

        return response()->json([
            'message'     => 'Delivery received. Inventory deducted and progress updated.',
            'all_met'     => $allMet,
            'received_at' => $now->toISOString(), // return the exact timestamp for frontend
        ]);
    }

    /**
     * POST /staff/donations/journey/deliveries/{deliveryId}/cancel
     *
     * Cancels a specific in-transit delivery only.
     * NO inventory deduction. NO allocated_qty change. Drive stays For Approval.
     */
    public function cancelDriveJourney($id)
    {
        $delivery = DonationDelivery::findOrFail($id);

        if ($delivery->status !== 'in_transit') {
            return response()->json(['message' => 'Delivery is not in transit.'], 422);
        }

        $delivery->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json(['message' => 'Delivery cancelled. Drive stays For Approval.']);
    }
}
