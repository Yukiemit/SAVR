<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodInventory extends Model
{
    protected $table = 'food_inventory';

    protected $fillable = [
        'food_name',
        'category',
        'quantity',
        'unit',
        'expiration_date',
        'notes',
        'meal_type',
        'special_notes',
    ];

    public function driveItems()
    {
        return $this->hasMany(DonationDriveItem::class);
    }
}
