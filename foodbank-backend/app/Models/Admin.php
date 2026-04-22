<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    protected $table = 'admins';

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'gender',
        'dob',
        'contact',
        'department',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
