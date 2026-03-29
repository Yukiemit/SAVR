<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationRequest extends Model
{
    protected $fillable = [
        'name',
        'email',
        'contact',
        'address',
        'urgency',
        'pax',
        'reason',
        'status',
    ];

    public function drive()
    {
        return $this->hasOne(DonationDrive::class);
    }
}