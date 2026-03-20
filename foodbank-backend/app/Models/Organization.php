<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
    'user_id',
    'org_name',
    'website',
    'industry',
    'type',
    'email',
    'contact_person',
    'contact'
];
}
