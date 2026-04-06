<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BeneficiaryOrganization extends Model
{
    protected $fillable = [
        'user_id', 'org_name', 'website', 'industry',
        'type', 'contact_person', 'contact',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}