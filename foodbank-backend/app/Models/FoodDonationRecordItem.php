<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodDonationRecordItem extends Model
{
    protected $fillable = [
        'food_donation_record_id',
        'food_name',
        'quantity',
        'unit',
        'category',
        'expiration_date',
        'special_notes',
        'photo_path',
    ];

    public function record()
    {
        return $this->belongsTo(FoodDonationRecord::class, 'food_donation_record_id');
    }
}
