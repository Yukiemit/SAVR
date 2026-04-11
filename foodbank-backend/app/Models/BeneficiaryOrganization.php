<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BeneficiaryOrganization extends Model
{
    protected $fillable = [
        'user_id', 'org_name', 'website', 'industry', 'type',
        'contact_person', 'contact', 'sector',
        'house', 'barangay', 'street', 'city', 'province', 'zip',
        'first_name', 'last_name', 'position', 'email',
        'count_infants', 'count_children', 'count_teenagers',
        'count_adults', 'count_seniors', 'count_pwd', 'count_pregnant',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}