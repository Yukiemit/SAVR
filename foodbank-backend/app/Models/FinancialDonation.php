<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialDonation extends Model
{
    protected $fillable = [
        'financial_donation_record_id',
        'user_id',
        'payment_type',
        'payment_method',
        'receipt_path',
        'receipt_number',
        'amount',
        'donated_at',
        'message',
        'paymongo_payment_id',
    ];

    protected $casts = [
        'donated_at' => 'datetime',
        'amount'     => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function record()
    {
        return $this->belongsTo(FinancialDonationRecord::class, 'financial_donation_record_id');
    }
}
