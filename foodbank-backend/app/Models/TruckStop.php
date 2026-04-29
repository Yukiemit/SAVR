<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TruckStop extends Model
{
    protected $fillable = [
        'truck_id',
        'stop_type',
        'name',
        'address',
        'latitude',
        'longitude',
        'date',
        'time_slot_start',
        'time_slot_end',
        'food_items',
        'food_name',
        'food_type',
        'qty',
        'unit',
        'source',
        'reference_id',
        'stop_order',
        'status',
    ];

    protected $casts = [
        'date'      => 'date',
        'latitude'  => 'float',
        'longitude' => 'float',
    ];

    public function truck()
    {
        return $this->belongsTo(Truck::class);
    }
}
