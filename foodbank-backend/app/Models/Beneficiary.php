<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Beneficiary extends Model
{
    protected $fillable = [
        'user_id', 'first_name', 'middle_name', 'last_name', 'suffix',
        'gender', 'dob', 'house', 'street', 'barangay',
        'city', 'province', 'zip', 'contact',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}