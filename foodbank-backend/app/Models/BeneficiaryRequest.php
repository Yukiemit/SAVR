<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BeneficiaryRequest extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'request_name',
        'food_type',
        'quantity',
        'unit',
        'amount',
        'population',
        'age_min',
        'age_max',
        'street',
        'barangay',
        'city',
        'zip_code',
        'request_date',
        'urgency',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function drive()
    {
        return $this->hasOne(DonationDrive::class, 'beneficiary_request_id');
    }
}
