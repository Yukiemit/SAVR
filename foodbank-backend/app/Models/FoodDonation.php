<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodDonation extends Model
{
    protected $fillable = [
        'user_id',
        'mode',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'delivery_address',
        'preferred_date',
        'time_slot_start',
        'time_slot_end',
        'status',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(FoodDonationItem::class);
    }
}