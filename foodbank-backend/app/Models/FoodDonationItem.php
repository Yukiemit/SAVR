<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodDonationItem extends Model
{
    protected $fillable = [
        'food_donation_id',
        'food_name',
        'quantity',
        'unit',
        'category',
        'expiration_date',
        'special_notes',
        'photo_path',
    ];
}