<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceDonationRecord extends Model
{
    protected $fillable = [
        'user_id',
        'service_type',
        'quantity',
        'frequency',
        'date',
        'day_of_week',
        'all_day',
        'starts_at',
        'ends_at',
        'address',
        'first_name',
        'last_name',
        'email',
        'notes',
        'status',
        'staff_notes',
    ];

    protected $casts = [
        'all_day' => 'boolean',
        'date'    => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function confirmed()
    {
        return $this->hasOne(ServiceDonation::class, 'service_donation_record_id');
    }
}
