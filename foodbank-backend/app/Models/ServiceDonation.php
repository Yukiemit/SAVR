<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceDonation extends Model
{
    protected $fillable = [
        'service_donation_record_id',
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

    public function record()
    {
        return $this->belongsTo(ServiceDonationRecord::class, 'service_donation_record_id');
    }
}
