<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Truck;

class TruckSeeder extends Seeder
{
    public function run(): void
    {
        Truck::updateOrCreate(
            ['unit_number' => 'TR01'],
            [
                'vehicle_type'    => 'Refrigerated Truck',
                'capacity'        => 1200,
                'current_address' => 'Manila, Metro Manila',
                'latitude'        => 14.5995,
                'longitude'       => 120.9842,
                'categories'      => ['Dry Goods', 'Canned Goods', 'Fresh Produce', 'Frozen Foods', 'Dairy', 'Meat / Poultry'],
                'source'          => 'manual',
                'status'          => 'active',
            ]
        );

        Truck::updateOrCreate(
            ['unit_number' => 'TR02'],
            [
                'vehicle_type'    => 'Delivery Van',
                'capacity'        => 800,
                'current_address' => 'Manila, Metro Manila',
                'latitude'        => 14.5995,
                'longitude'       => 120.9842,
                'categories'      => ['Dry Goods', 'Canned Goods', 'Bakery', 'Grains & Cereals', 'Beverages', 'Condiments'],
                'source'          => 'manual',
                'status'          => 'active',
            ]
        );
    }
}
