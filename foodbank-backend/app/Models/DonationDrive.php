<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationDrive extends Model
{
    protected $fillable = [
        'donation_request_id',
        'beneficiary_request_id',
        'staff_id',
        'drive_title',
        'type',
        'goal',
        'start_date',
        'end_date',
        'address',
        'contact_person',
        'contact',
        'email',
        'status',
        'prepared_at',
        'transit_at',
        'received_at',
    ];

    public function request()
    {
        return $this->belongsTo(DonationRequest::class, 'donation_request_id');
    }

    public function beneficiaryRequest()
    {
        return $this->belongsTo(BeneficiaryRequest::class, 'beneficiary_request_id');
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function items()
    {
        return $this->hasMany(DonationDriveItem::class);
    }

    public function deliveries()
    {
        return $this->hasMany(DonationDelivery::class);
    }
}