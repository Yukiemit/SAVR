<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // ✅ ADD THIS

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // ✅ ADD HasApiTokens HERE

    protected $fillable = [
        'name',
        'username',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'gender',
        'dob',
        'house',
        'street',
        'barangay',
        'city',
        'province',
        'zip',
        'contact',
        'email',
        'password',
        'role',
        'pending_data',
        'otp_code',
        'otp_expires_at',
        'email_verified',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'otp_expires_at'    => 'datetime',
            'password'          => 'hashed',
            'email_verified'    => 'boolean',
        ];
    }
}