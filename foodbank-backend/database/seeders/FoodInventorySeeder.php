<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FoodInventory;

class FoodInventorySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Raw Ingredients — Canned Goods
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Canned Sardines',    'category' => 'Canned Goods',        'quantity' => 500,  'unit' => 'cans',   'expiration_date' => '2026-08-15', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Canned Corned Beef', 'category' => 'Canned Goods',        'quantity' => 300,  'unit' => 'cans',   'expiration_date' => '2026-10-20', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Canned Tuna',        'category' => 'Canned Goods',        'quantity' => 420,  'unit' => 'cans',   'expiration_date' => '2027-01-05', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Canned Pineapple',   'category' => 'Canned Goods',        'quantity' => 180,  'unit' => 'cans',   'expiration_date' => '2027-05-30', 'special_notes' => null],

            // Raw Ingredients — Grains & Cereals
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'White Rice',         'category' => 'Grains & Cereals',    'quantity' => 1000, 'unit' => 'kg',     'expiration_date' => '2026-12-31', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Brown Rice',         'category' => 'Grains & Cereals',    'quantity' => 600,  'unit' => 'kg',     'expiration_date' => '2026-11-20', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Oatmeal',            'category' => 'Grains & Cereals',    'quantity' => 250,  'unit' => 'kg',     'expiration_date' => '2026-09-10', 'special_notes' => null],

            // Raw Ingredients — Dry Goods
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Instant Noodles',    'category' => 'Dry Goods',           'quantity' => 800,  'unit' => 'packs',  'expiration_date' => '2026-06-15', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Mongo Beans',        'category' => 'Dry Goods',           'quantity' => 400,  'unit' => 'kg',     'expiration_date' => '2026-10-10', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'All-Purpose Flour',  'category' => 'Dry Goods',           'quantity' => 200,  'unit' => 'kg',     'expiration_date' => '2026-07-01', 'special_notes' => null],

            // Raw Ingredients — Meat
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Pork Belly',         'category' => 'Meat',                'quantity' => 150,  'unit' => 'kg',     'expiration_date' => '2026-05-20', 'special_notes' => 'Keep refrigerated.'],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Chicken Breast',     'category' => 'Meat',                'quantity' => 200,  'unit' => 'kg',     'expiration_date' => '2026-05-15', 'special_notes' => 'Keep refrigerated.'],

            // Raw Ingredients — Protein Alternatives
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Tofu',               'category' => 'Protein Alternatives','quantity' => 300,  'unit' => 'packs',  'expiration_date' => '2026-05-10', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Tokwa',              'category' => 'Protein Alternatives','quantity' => 150,  'unit' => 'packs',  'expiration_date' => '2026-05-08', 'special_notes' => null],

            // Raw Ingredients — Dairy
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Powdered Milk',      'category' => 'Dairy',               'quantity' => 250,  'unit' => 'kg',     'expiration_date' => '2026-07-18', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Evaporated Milk',    'category' => 'Dairy',               'quantity' => 120,  'unit' => 'cans',   'expiration_date' => '2026-09-30', 'special_notes' => null],

            // Raw Ingredients — Fats & Oils
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Cooking Oil',        'category' => 'Fats & Oils',         'quantity' => 200,  'unit' => 'L',      'expiration_date' => '2026-09-01', 'special_notes' => null],

            // Raw Ingredients — Fruits
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Banana',             'category' => 'Fruits',              'quantity' => 500,  'unit' => 'pcs',    'expiration_date' => '2026-04-28', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Apple',              'category' => 'Fruits',              'quantity' => 300,  'unit' => 'pcs',    'expiration_date' => '2026-05-05', 'special_notes' => null],

            // Raw Ingredients — Vegetables
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Kangkong',           'category' => 'Vegetables',          'quantity' => 200,  'unit' => 'kg',     'expiration_date' => '2026-04-27', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Ampalaya',           'category' => 'Vegetables',          'quantity' => 100,  'unit' => 'kg',     'expiration_date' => '2026-04-26', 'special_notes' => null],

            // Raw Ingredients — Sugars & Sweets
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'Brown Sugar',        'category' => 'Sugars & Sweets',     'quantity' => 300,  'unit' => 'kg',     'expiration_date' => '2027-01-01', 'special_notes' => null],
            ['meal_type' => 'Raw Ingredients', 'food_name' => 'White Sugar',        'category' => 'Sugars & Sweets',     'quantity' => 250,  'unit' => 'kg',     'expiration_date' => '2027-03-15', 'special_notes' => null],

            // Prepared Meals
            ['meal_type' => 'Prepared Meals',  'food_name' => 'Chicken Adobo',      'category' => 'Meat',                'quantity' => 48,   'unit' => 'meal',   'expiration_date' => '2026-06-30', 'special_notes' => 'Reheat before serving.'],
            ['meal_type' => 'Prepared Meals',  'food_name' => 'Vegetable Stir Fry', 'category' => 'Vegetables',          'quantity' => 8,    'unit' => 'meal',   'expiration_date' => '2026-06-30', 'special_notes' => null],
            ['meal_type' => 'Prepared Meals',  'food_name' => 'Cinnamon Roll',      'category' => 'Sugars & Sweets',     'quantity' => 680,  'unit' => 'meal',   'expiration_date' => '2026-06-30', 'special_notes' => null],
            ['meal_type' => 'Prepared Meals',  'food_name' => 'Arroz Caldo',        'category' => 'Grains & Cereals',    'quantity' => 120,  'unit' => 'meal',   'expiration_date' => '2026-05-10', 'special_notes' => 'Serve hot.'],
            ['meal_type' => 'Prepared Meals',  'food_name' => 'Pancit Bihon',       'category' => 'Dry Goods',           'quantity' => 60,   'unit' => 'meal',   'expiration_date' => '2026-05-12', 'special_notes' => null],
        ];

        foreach ($items as $item) {
            FoodInventory::create($item);
        }
    }
}
