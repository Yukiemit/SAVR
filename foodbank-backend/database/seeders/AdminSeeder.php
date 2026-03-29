<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Staff;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ BUILT-IN ADMIN ACCOUNT
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name'              => 'Super Admin',
                'username'          => 'admin',
                'email'             => null,
                'password'          => Hash::make('Admin@1234'),
                'role'              => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // ✅ BUILT-IN STAFF ACCOUNT
        $staffUser = User::updateOrCreate(
            ['username' => 'staff01'],
            [
                'name'              => 'Staff One',
                'username'          => 'staff01',
                'email'             => null,
                'password'          => Hash::make('Staff@1234'),
                'role'              => 'staff',
                'email_verified_at' => now(),
            ]
        );

        // ✅ CREATE STAFF PROFILE
        Staff::updateOrCreate(
            ['user_id' => $staffUser->id],
            [
                'first_name' => 'Staff',
                'last_name'  => 'One',
                'gender'     => 'Male',
                'contact'    => '09000000000',
                'city'       => 'Manila',
                'province'   => 'Metro Manila',
            ]
        );
    }
}