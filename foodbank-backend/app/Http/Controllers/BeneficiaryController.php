<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Beneficiary;

class BeneficiaryController extends Controller
{
    // GET /api/beneficiary/profile  ← used by NavBar
    public function profile(Request $request)
    {
        $user        = $request->user();
        $beneficiary = Beneficiary::where('user_id', $user->id)->first();

        return response()->json([
            'name'       => $user->name,
            'first_name' => $beneficiary?->first_name ?? '',
            'last_name'  => $beneficiary?->last_name  ?? '',
            'email'      => $user->email,
        ]);
    }

    // GET /api/beneficiary/dashboard  ← used by Dashboard page
    public function dashboard(Request $request)
    {
        $user        = $request->user();
        $beneficiary = Beneficiary::where('user_id', $user->id)->first();

        $firstName = $beneficiary?->first_name ?? '';
        $lastName  = $beneficiary?->last_name  ?? '';
        $fullName  = trim("$firstName $lastName") ?: $user->name;

        // TODO: replace with real queries once you have a requests table
        return response()->json([
            'name'            => $fullName,
            'first_name'      => $firstName,
            'last_name'       => $lastName,
            'total_requests'  => 0,
            'active_count'    => 0,
            'pending_count'   => 0,
            'recent_requests' => [],
        ]);
    }
}