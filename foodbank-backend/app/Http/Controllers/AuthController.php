<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Donor;
use App\Models\Organization;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ✅ REGISTER
    public function register(Request $request)
    {
        if ($request->role === 'donor') {

            // ✅ VALIDATE DONOR
            $request->validate([
                'first_name' => 'required|string',
                'last_name' => 'required|string',
                'middle_name' => 'nullable|string',
                'suffix' => 'nullable|string',
                'email' => 'required|email|unique:users',
                'password' => 'required|min:6|confirmed',
            ]);

            // ✅ CREATE USER (AUTH ONLY)
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'donor'
            ]);

            // ✅ CREATE DONOR DATA
            Donor::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'suffix' => $request->suffix,
                'gender' => $request->gender,
                'dob' => $request->dob,
                'house' => $request->house,
                'street' => $request->street,
                'barangay' => $request->barangay,
                'city' => $request->city,
                'province' => $request->province,
                'zip' => $request->zip,
                'contact' => $request->contact,
            ]);

        } else {

            // ✅ VALIDATE ORGANIZATION
            $request->validate([
                'org_name' => 'required|string',
                'email' => 'required|email|unique:users',
                'password' => 'required|min:6|confirmed',
            ]);

            // ✅ CREATE USER
            $user = User::create([
                'name' => $request->org_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'organization'
            ]);

            // ✅ CREATE ORGANIZATION DATA
            Organization::create([
                'user_id' => $user->id,
                'org_name' => $request->org_name,
                'website' => $request->website,
                'industry' => $request->industry,
                'type' => $request->type,
                'email' => $request->email,
                'contact_person' => $request->contact_person,
                'contact' => $request->contact,
            ]);
        }

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user
        ], 201);
    }

    // ✅ LOGIN (NO CHANGE)
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user
        ], 200);
    }
}