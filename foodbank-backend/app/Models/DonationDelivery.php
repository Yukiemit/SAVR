<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationDelivery extends Model
{
    protected $fillable = [
        'donation_drive_id',
        'status',
        'delivery_items',
        'notes',
        'prepared_at',
        'received_at',
        'cancelled_at',
    ];

    protected $casts = [
        'delivery_items' => 'array',
        'prepared_at'    => 'datetime',
        'received_at'    => 'datetime',
        'cancelled_at'   => 'datetime',
    ];

    public function drive()
    {
        return $this->belongsTo(DonationDrive::class, 'donation_drive_id');
    }
}
