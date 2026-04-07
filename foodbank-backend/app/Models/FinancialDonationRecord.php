<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialDonationRecord extends Model
{
    protected $fillable = [
        'user_id',
        'payment_type',
        'payment_method',
        'receipt_path',
        'receipt_number',
        'amount',
        'donated_at',
        'message',
        'paymongo_link_id',
        'paymongo_payment_id',
        'status',
        'staff_notes',
    ];

    protected $casts = [
        'donated_at' => 'datetime',
        'amount'     => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedDonation()
    {
        return $this->hasOne(FinancialDonation::class, 'financial_donation_record_id');
    }

    // Convenience: was this paid via PayMongo?
    public function isPayMongo(): bool
    {
        return $this->payment_type === 'paymongo';
    }
}
