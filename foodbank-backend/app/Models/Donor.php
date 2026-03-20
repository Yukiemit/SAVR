<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donor extends Model
{
    protected $fillable = [
    'user_id',
    'first_name',
    'middle_name',
    'last_name',
    'suffix',
    'gender',
    'dob',
    'house',
    'street',
    'email',
    'barangay',
    'city',
    'province',
    'zip',
    'contact'
];
}
