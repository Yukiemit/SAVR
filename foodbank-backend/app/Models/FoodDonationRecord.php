<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodDonationRecord extends Model
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
        'staff_notes',
        'accepted_at',
        'received_at',
        'rejected_at',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'received_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(FoodDonationRecordItem::class);
    }
}
