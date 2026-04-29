<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Truck;
use App\Models\TruckStop;
use App\Models\FoodDonationRecord;
use App\Models\DonationDrive;

class TruckOptimizationController extends Controller
{
    /**
     * GET /staff/truck-optimization/pending-stops
     * Returns unassigned stops from truck_stops table
     */
    public function getPendingStops()
    {
        // Get all unassigned truck stops
        $unassignedStops = TruckStop::whereNull('truck_id')->get();

        $stops = [];

        foreach ($unassignedStops as $stop) {
            $stops[] = [
                'id'              => $stop->id,
                'type'            => $stop->stop_type === 'PICKUP' ? 'pickup' : 'deliver',
                'name'            => $stop->name,
                'address'         => $stop->address,
                'pref_date'       => $stop->date ? $stop->date->format('Y-m-d') : null,
                'time_slot_start' => $stop->time_slot_start,
                'time_slot_end'   => $stop->time_slot_end,
                'food_items'      => $stop->food_items ?? '',
                'source'          => $stop->source,
                'donation_id'     => $stop->source === 'food_donation' ? $stop->reference_id : null,
                'drive_id'        => $stop->source === 'donation_drive' ? $stop->reference_id : null,
            ];
        }

        return response()->json($stops);
    }

    /**
     * GET /staff/truck-optimization/trucks
     * Returns all active trucks with their schedules
     */
    public function getTrucks()
    {
        $trucks = Truck::where('status', 'active')
            ->with(['stops' => function ($query) {
                $query->orderBy('stop_order')->orderBy('date');
            }])
            ->get()
            ->map(fn($truck) => $this->formatTruck($truck));

        return response()->json($trucks);
    }

    /**
     * GET /staff/truck-optimization/occupancy
     * Returns map of truck_id → array of dates with stops
     */
    public function getOccupancy()
    {
        $trucks = Truck::where('status', 'active')->get();
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

    /**
     * POST /staff/truck-optimization/assign-stop
     * Assigns a pending stop to a truck
     */
    public function assignStop(Request $request)
    {
        $request->validate([
            'stop_id' => 'required|integer',
            'truck_id' => 'required|integer',
        ]);

        $stop = TruckStop::findOrFail($request->stop_id);
        $truck = Truck::findOrFail($request->truck_id);

        // Get the next stop_order for this truck
        $nextOrder = TruckStop::where('truck_id', $truck->id)->max('stop_order') ?? 0;
        $nextOrder++;

        // Assign the stop to the truck
        $stop->update([
            'truck_id'   => $truck->id,
            'stop_order' => $nextOrder,
        ]);

        // Return all trucks with updated schedules
        $trucks = Truck::where('status', 'active')
            ->with(['stops' => function ($query) {
                $query->orderBy('stop_order')->orderBy('date');
            }])
            ->get()
            ->map(fn($t) => $this->formatTruck($t));

        return response()->json(['trucks' => $trucks]);
    }

    /**
     * POST /staff/truck-optimization/auto-assign
     * Greedily assigns all unassigned stops to available trucks
     */
    public function autoAssign()
    {
        // Get all unassigned stops
        $unassignedStops = TruckStop::whereNull('truck_id')->get();

        $assignedCount = 0;
        $remaining = [];

        foreach ($unassignedStops as $stop) {
            // Find first available truck (simple greedy: just pick the first active truck)
            $truck = Truck::where('status', 'active')->first();

            if ($truck) {
                $nextOrder = TruckStop::where('truck_id', $truck->id)->max('stop_order') ?? 0;
                $nextOrder++;

                $stop->update([
                    'truck_id'   => $truck->id,
                    'stop_order' => $nextOrder,
                ]);
                $assignedCount++;
            } else {
                $remaining[] = $stop;
            }
        }

        // Return updated trucks and remaining unassigned stops
        $trucks = Truck::where('status', 'active')
            ->with(['stops' => function ($query) {
                $query->orderBy('stop_order')->orderBy('date');
            }])
            ->get()
            ->map(fn($t) => $this->formatTruck($t));

        $remainingPending = TruckStop::whereNull('truck_id')
            ->get()
            ->map(fn($stop) => [
                'id'              => $stop->id,
                'type'            => $stop->stop_type === 'PICKUP' ? 'pickup' : 'deliver',
                'name'            => $stop->name,
                'address'         => $stop->address,
                'pref_date'       => $stop->date,
                'time_slot_start' => $stop->time_slot_start,
                'time_slot_end'   => $stop->time_slot_end,
                'food_items'      => $stop->food_items ?? '',
                'source'          => $stop->source,
            ]);

        return response()->json([
            'trucks'            => $trucks,
            'remaining_pending' => $remainingPending,
        ]);
    }

    /**
     * PUT /staff/truck-optimization/trucks/{id}/schedule
     * Updates the schedule (stop order) for a truck
     */
    public function updateSchedule(Request $request, $id)
    {
        $truck = Truck::findOrFail($id);

        $request->validate([
            'schedule' => 'required|array',
            'schedule.*.id' => 'required|integer',
        ]);

        // Update stop_order for each stop
        foreach ($request->schedule as $index => $stopData) {
            TruckStop::where('id', $stopData['id'])
                ->where('truck_id', $truck->id)
                ->update(['stop_order' => $index]);
        }

        // Return the updated truck
        $truck->load(['stops' => function ($query) {
            $query->orderBy('stop_order')->orderBy('date');
        }]);

        return response()->json(['truck' => $this->formatTruck($truck)]);
    }

    /**
     * POST /staff/truck-optimization/trucks
     * Creates a new truck
     */
    public function storeTruck(Request $request)
    {
        $request->validate([
            'unit_number'     => 'required|string|unique:trucks',
            'vehicle_type'    => 'required|string',
            'capacity'        => 'nullable|integer',
            'current_address' => 'nullable|string',
            'categories'      => 'nullable|array',
        ]);

        $truck = Truck::create([
            'unit_number'     => $request->unit_number,
            'vehicle_type'    => $request->vehicle_type,
            'capacity'        => $request->capacity,
            'current_address' => $request->current_address,
            'categories'      => $request->categories ?? [],
            'source'          => 'manual',
        ]);

        return response()->json($this->formatTruck($truck), 201);
    }

    /**
     * DELETE /staff/truck-optimization/trucks/{id}
     * Deletes a truck and unassigns its stops
     */
    public function destroyTruck($id)
    {
        $truck = Truck::findOrFail($id);

        // Unassign all stops
        TruckStop::where('truck_id', $truck->id)->update(['truck_id' => null]);

        // Delete the truck
        $truck->delete();

        return response()->json(['message' => 'Truck deleted and stops unassigned.']);
    }

    /**
     * Format a truck with its schedule for the frontend
     */
    private function formatTruck($truck)
    {
        return [
            'id'              => $truck->id,
            'unit_number'     => $truck->unit_number,
            'vehicle_type'    => $truck->vehicle_type,
            'capacity'        => $truck->capacity,
            'current_address' => $truck->current_address,
            'categories'      => $truck->categories ?? [],
            'source'          => $truck->source,
            'schedule'        => $truck->stops->map(fn($stop) => [
                'id'              => $stop->id,
                'stop_type'       => $stop->stop_type,
                'name'            => $stop->name,
                'address'         => $stop->address,
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
