<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonorOrganization extends Model
{
    protected $fillable = [
        'user_id', 'org_name', 'website', 'industry',
        'type', 'contact_person', 'contact',
        'first_name', 'last_name', 'email',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}