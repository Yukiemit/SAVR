<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Truck;
use App\Models\TruckStop;
use App\Models\FoodDonationRecord;
use App\Models\DonationDrive;
use App\Services\GeocodingService;

class TruckOptimizationController extends Controller
{
    private GeocodingService $geo;

    public function __construct(GeocodingService $geo)
    {
        $this->geo = $geo;
    }

    // ── GET /staff/truck-optimization/pending-stops ──────────────────────────
    public function getPendingStops()
    {
        // Auto-backfill any accepted donations / OnGoing drives that have no stop yet
        try {
            $this->backfillMissingStops();
        } catch (\Exception $e) {
            \Log::warning('Truck stop backfill failed: ' . $e->getMessage());
        }

        $stops = TruckStop::whereNull('truck_id')
            ->where('status', '!=', 'completed')
            ->orderByRaw("date ASC NULLS LAST")
            ->get()
            ->map(fn($s) => $this->formatPendingStop($s));

        return response()->json($stops);
    }

    // ── Backfill: create truck stops for already-accepted donations / drives ──
    private function backfillMissingStops(): void
    {
        // 1. Food donations that are accepted but not yet received and have no stop
        $accepted = FoodDonationRecord::with(['items', 'user'])
            ->where('status', 'accepted')
            ->get();

        foreach ($accepted as $record) {
            try {
                $exists = TruckStop::where('source', 'food_donation')
                    ->where('reference_id', $record->id)
                    ->exists();

                if (!$exists) {
                    $stopAddress = $record->mode === 'pickup'
                        ? $record->pickup_address
                        : $record->delivery_address;

                    // Skip geocoding here — coordinates are filled lazily during autoAssign
                    TruckStop::create([
                        'truck_id'        => null,
                        'stop_type'       => 'PICKUP',
                        'name'            => $record->user?->name ?? 'Unknown Donor',
                        'address'         => $stopAddress ?? 'Unknown Address',
                        'latitude'        => null,
                        'longitude'       => null,
                        'date'            => $record->preferred_date,
                        'time_slot_start' => $record->time_slot_start ?? '09:00',
                        'time_slot_end'   => $record->time_slot_end   ?? '17:00',
                        'food_items'      => $record->items->map(fn($i) => "{$i->food_name} | {$i->quantity} {$i->unit} | {$i->category}")->join(' · '),
                        'food_name'       => $record->items->first()?->food_name ?? '',
                        'food_type'       => $record->items->first()?->category   ?? '',
                        'qty'             => (string)($record->items->first()?->quantity ?? 0),
                        'unit'            => $record->items->first()?->unit ?? '',
                        'source'          => 'food_donation',
                        'reference_id'    => $record->id,
                        'status'          => 'pending',
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning("Backfill failed for food_donation #{$record->id}: " . $e->getMessage());
            }
        }

        // 2. Donation drives that are OnGoing but have no truck stop yet
        $ongoing = DonationDrive::where('status', 'OnGoing')->get();

        foreach ($ongoing as $drive) {
            try {
                $exists = TruckStop::where('source', 'donation_drive')
                    ->where('reference_id', $drive->id)
                    ->exists();

                if (!$exists) {
                    // Skip geocoding here — coordinates filled lazily during autoAssign
                    TruckStop::create([
                        'truck_id'        => null,
                        'stop_type'       => 'DELIVER',
                        'name'            => $drive->drive_title ?? 'Unnamed Drive',
                        'address'         => $drive->address ?? 'Unknown Address',
                        'latitude'        => null,
                        'longitude'       => null,
                        'date'            => $drive->start_date,
                        'time_slot_start' => '09:00',
                        'time_slot_end'   => '17:00',
                        'food_items'      => '',
                        'source'          => 'donation_drive',
                        'reference_id'    => $drive->id,
                        'status'          => 'pending',
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning("Backfill failed for donation_drive #{$drive->id}: " . $e->getMessage());
            }
        }
    }

    // ── GET /staff/truck-optimization/trucks ─────────────────────────────────
    public function getTrucks()
    {
        $trucks = Truck::where('status', 'active')
            ->with(['stops' => fn($q) => $q->where('status', '!=', 'completed')->orderBy('stop_order')->orderBy('date')])
            ->get()
            ->map(fn($t) => $this->formatTruck($t));

        return response()->json($trucks);
    }

    // ── GET /staff/truck-optimization/occupancy ──────────────────────────────
    public function getOccupancy()
    {
        $trucks    = Truck::where('status', 'active')->get();
        $occupancy = [];

        foreach ($trucks as $truck) {
            $dates = TruckStop::where('truck_id', $truck->id)
                ->whereNotNull('date')
                ->distinct('date')
                ->pluck('date')
                ->map(fn($d) => $d->format('Y-m-d'))
                ->values()
                ->toArray();

            if (!empty($dates)) {
                $occupancy[$truck->id] = $dates;
            }
        }

        return response()->json($occupancy);
    }

    // ── POST /staff/truck-optimization/assign-stop ───────────────────────────
    public function assignStop(Request $request)
    {
        $request->validate([
            'stop_id'  => 'required|integer',
            'truck_id' => 'required|integer',
        ]);

        $stop  = TruckStop::findOrFail($request->stop_id);
        $truck = Truck::findOrFail($request->truck_id);

        // Validate operating window 07:00 – 21:00
        if ($stop->time_slot_start && $stop->time_slot_end) {
            $start = substr($stop->time_slot_start, 0, 5);
            $end   = substr($stop->time_slot_end,   0, 5);
            if ($start < '07:00' || $end > '21:00') {
                return response()->json(['message' => 'Stops can only be scheduled between 7:00 AM and 9:00 PM.'], 422);
            }
        }

        $nextOrder = TruckStop::where('truck_id', $truck->id)->max('stop_order') ?? 0;
        $stop->update(['truck_id' => $truck->id, 'stop_order' => $nextOrder + 1]);

        $trucks = Truck::where('status', 'active')
            ->with(['stops' => fn($q) => $q->orderBy('stop_order')->orderBy('date')])
            ->get()
            ->map(fn($t) => $this->formatTruck($t));

        return response()->json(['trucks' => $trucks]);
    }

    // ── POST /staff/truck-optimization/auto-assign ───────────────────────────
    // Nearest-truck logic: assign each pending stop to the closest active truck.
    // "Current position" of a truck = its last stop's coords, or its base coords.
    // TR (manual) trucks are preferred over SD (service_donation) trucks.
    public function autoAssign()
    {
        $unassigned = TruckStop::whereNull('truck_id')
            ->orderByRaw("date ASC NULLS LAST")
            ->get();

        // Load all active trucks with their stops (need last stop coords)
        $trucks = Truck::where('status', 'active')
            ->with(['stops' => fn($q) => $q->orderBy('stop_order')->orderBy('date')])
            ->get();

        if ($trucks->isEmpty()) {
            return response()->json([
                'trucks'            => [],
                'remaining_pending' => $unassigned->map(fn($s) => $this->formatPendingStop($s)),
            ]);
        }

        foreach ($unassigned as $stop) {
            // Respect 07:00–21:00 window
            if ($stop->time_slot_start && $stop->time_slot_end) {
                $s = substr($stop->time_slot_start, 0, 5);
                $e = substr($stop->time_slot_end,   0, 5);
                if ($s < '07:00' || $e > '21:00') continue;
            }

            // Geocode the stop if not yet done
            if (!$stop->latitude && $stop->address) {
                $coords = $this->geo->geocode($stop->address);
                if ($coords) {
                    $stop->update(['latitude' => $coords['lat'], 'longitude' => $coords['lng']]);
                    $stop->refresh();
                }
            }

            $bestTruck    = null;
            $bestDistance = PHP_FLOAT_MAX;

            foreach ($trucks as $truck) {
                // Get truck's effective current position (last stop or base)
                $lastStop = $truck->stops->last();
                $tLat = $lastStop?->latitude  ?? $truck->latitude;
                $tLng = $lastStop?->longitude ?? $truck->longitude;

                // Calculate distance if both have coordinates
                if ($stop->latitude && $stop->longitude && $tLat && $tLng) {
                    $dist = $this->geo->haversineDistance(
                        $tLat, $tLng,
                        $stop->latitude, $stop->longitude
                    );
                } else {
                    // No coords — use stop count as proxy, TR trucks get 0 bonus
                    $dist = $truck->stops->count() * 10;
                }

                // TR (manual) trucks get a 50 km advantage over SD trucks
                if ($truck->source === 'service_donation') {
                    $dist += 50;
                }

                if ($dist < $bestDistance) {
                    $bestDistance = $dist;
                    $bestTruck    = $truck;
                }
            }

            if ($bestTruck) {
                $nextOrder = TruckStop::where('truck_id', $bestTruck->id)->max('stop_order') ?? 0;
                $stop->update(['truck_id' => $bestTruck->id, 'stop_order' => $nextOrder + 1]);

                // Refresh the truck's stops so next iteration sees updated position
                $bestTruck->load(['stops' => fn($q) => $q->orderBy('stop_order')->orderBy('date')]);
            }
        }

        $trucks = Truck::where('status', 'active')
            ->with(['stops' => fn($q) => $q->orderBy('stop_order')->orderBy('date')])
            ->get()
            ->map(fn($t) => $this->formatTruck($t));

        $remaining = TruckStop::whereNull('truck_id')
            ->orderByRaw("date ASC NULLS LAST")
            ->get()
            ->map(fn($s) => $this->formatPendingStop($s));

        return response()->json(['trucks' => $trucks, 'remaining_pending' => $remaining]);
    }

    // ── PUT /staff/truck-optimization/trucks/{id}/schedule ──────────────────
    public function updateSchedule(Request $request, $id)
    {
        $truck = Truck::findOrFail($id);
        $request->validate(['schedule' => 'required|array', 'schedule.*.id' => 'required|integer']);

        foreach ($request->schedule as $index => $stopData) {
            TruckStop::where('id', $stopData['id'])
                ->where('truck_id', $truck->id)
                ->update(['stop_order' => $index]);
        }

        $truck->load(['stops' => fn($q) => $q->orderBy('stop_order')->orderBy('date')]);
        return response()->json(['truck' => $this->formatTruck($truck)]);
    }

    // ── POST /staff/truck-optimization/trucks ────────────────────────────────
    public function storeTruck(Request $request)
    {
        $request->validate([
            'unit_number'     => 'required|string|unique:trucks',
            'vehicle_type'    => 'required|string',
            'capacity'        => 'nullable|integer',
            'current_address' => 'nullable|string',
            'categories'      => 'nullable|array',
        ]);

        // Geocode the truck's base address
        $lat = null; $lng = null;
        if ($request->current_address) {
            $coords = $this->geo->geocode($request->current_address);
            if ($coords) { $lat = $coords['lat']; $lng = $coords['lng']; }
        }

        $truck = Truck::create([
            'unit_number'     => $request->unit_number,
            'vehicle_type'    => $request->vehicle_type,
            'capacity'        => $request->capacity,
            'current_address' => $request->current_address,
            'categories'      => $request->categories ?? [],
            'source'          => 'manual',
            'latitude'        => $lat,
            'longitude'       => $lng,
        ]);

        return response()->json($this->formatTruck($truck->load('stops')), 201);
    }

    // ── DELETE /staff/truck-optimization/trucks/{id} ─────────────────────────
    public function destroyTruck($id)
    {
        $truck = Truck::findOrFail($id);
        TruckStop::where('truck_id', $truck->id)->update(['truck_id' => null]);
        $truck->delete();
        return response()->json(['message' => 'Truck deleted and stops unassigned.']);
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private function formatPendingStop($stop): array
    {
        return [
            'id'              => $stop->id,
            'type'            => $stop->stop_type === 'PICKUP' ? 'pickup' : 'deliver',
            'name'            => $stop->name,
            'address'         => $stop->address,
            'lat'             => $stop->latitude  ? (float) $stop->latitude  : null,
            'lng'             => $stop->longitude ? (float) $stop->longitude : null,
            'pref_date'       => $stop->date ? $stop->date->format('Y-m-d') : null,
            'time_slot_start' => $stop->time_slot_start,
            'time_slot_end'   => $stop->time_slot_end,
            'food_items'      => $stop->food_items ?? '',
            'source'          => $stop->source,
            'donation_id'     => $stop->source === 'food_donation'  ? $stop->reference_id : null,
            'drive_id'        => $stop->source === 'donation_drive' ? $stop->reference_id : null,
        ];
    }

    private function formatTruck($truck): array
    {
        return [
            'id'              => $truck->id,
            'unit_number'     => $truck->unit_number,
            'vehicle_type'    => $truck->vehicle_type,
            'capacity'        => $truck->capacity,
            'current_address' => $truck->current_address,
            'lat'             => $truck->latitude  ? (float) $truck->latitude  : null,
            'lng'             => $truck->longitude ? (float) $truck->longitude : null,
            'categories'      => $truck->categories ?? [],
            'source'          => $truck->source,
            'schedule'        => $truck->stops->map(fn($stop) => [
                'id'              => $stop->id,
                'stop_type'       => $stop->stop_type,
                'name'            => $stop->name,
                'address'         => $stop->address,
                'lat'             => $stop->latitude  ? (float) $stop->latitude  : null,
                'lng'             => $stop->longitude ? (float) $stop->longitude : null,
                'date'            => $stop->date ? $stop->date->format('Y-m-d') : null,
                'time_slot_start' => $stop->time_slot_start,
                'time_slot_end'   => $stop->time_slot_end,
                'food_type'       => $stop->food_type,
                'food_name'       => $stop->food_name,
                'qty'             => $stop->qty,
                'unit'            => $stop->unit,
            ])->toArray(),
        ];
    }
}
