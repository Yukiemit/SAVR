<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationDriveItem extends Model
{
    protected $fillable = [
        'donation_drive_id',
        'food_inventory_id',
        'food_name',
        'category',
        'goal_qty',
        'allocated_qty',
        'unit',
        'expiration_date',
    ];

    public function drive()
    {
        return $this->belongsTo(DonationDrive::class, 'donation_drive_id');
    }

    public function inventory()
    {
        return $this->belongsTo(FoodInventory::class, 'food_inventory_id');
    }
}
