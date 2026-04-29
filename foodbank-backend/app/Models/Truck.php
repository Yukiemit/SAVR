<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Truck extends Model
{
    protected $fillable = [
        'unit_number',
        'vehicle_type',
        'capacity',
        'current_address',
        'categories',
        'source',
        'service_donation_id',
        'status',
    ];

    protected $casts = [
        'categories' => 'array',
    ];

    public function stops()
    {
        return $this->hasMany(TruckStop::class)->orderBy('stop_order')->orderBy('date');
    }
}
