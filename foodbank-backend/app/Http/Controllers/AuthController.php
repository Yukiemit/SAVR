<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Donor;
use App\Models\Organization;
use App\Mail\OtpMail;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    // ── HELPER: generate OTP, save to user, send email ──
    private function sendOtp(User $user): void
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->otp_code       = $otp;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        Mail::to($user->email)->send(new OtpMail($otp, $user->name));
    }

    // ✅ REGISTER — Donor & Organization only
    // Donor/Org profile is created AFTER email is verified
    public function register(Request $request)
    {
        if ($request->role === 'donor') {

            $request->validate([
                'first_name'  => 'required|string',
                'last_name'   => 'required|string',
                'middle_name' => 'nullable|string',
                'suffix'      => 'nullable|string',
                'email'       => 'required|email|unique:users',
                'password'    => 'required|min:6|confirmed',
            ]);

            $user = User::create([
                'name'     => $request->first_name . ' ' . $request->last_name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'donor',

                // ✅ STORE DONOR DATA TEMPORARILY until verified
                'pending_data' => json_encode([
                    'first_name'  => $request->first_name,
                    'middle_name' => $request->middle_name,
                    'last_name'   => $request->last_name,
                    'suffix'      => $request->suffix,
                    'gender'      => $request->gender,
                    'dob'         => $request->dob,
                    'house'       => $request->house,
                    'street'      => $request->street,
                    'barangay'    => $request->barangay,
                    'city'        => $request->city,
                    'province'    => $request->province,
                    'zip'         => $request->zip,
                    'contact'     => $request->contact,
                ]),
            ]);

        } else {

            $request->validate([
                'org_name' => 'required|string',
                'email'    => 'required|email|unique:users',
                'password' => 'required|min:6|confirmed',
            ]);

            $user = User::create([
                'name'     => $request->org_name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'organization',

                // ✅ STORE ORG DATA TEMPORARILY until verified
                'pending_data' => json_encode([
                    'org_name'       => $request->org_name,
                    'website'        => $request->website,
                    'industry'       => $request->industry,
                    'type'           => $request->type,
                    'contact_person' => $request->contact_person,
                    'contact'        => $request->contact,
                ]),
            ]);
        }

        $this->sendOtp($user);

        return response()->json([
            'message' => 'Registration successful. Please check your email for the OTP.',
            'user_id' => $user->id,
        ], 201);
    }

    // ✅ VERIFY OTP — creates Donor/Org profile only after verification
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp'     => 'required|string|size:6',
        ]);

        $user = User::findOrFail($request->user_id);

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        if (
            $user->otp_code === $request->otp &&
            $user->otp_expires_at &&
            now()->lessThanOrEqualTo($user->otp_expires_at)
        ) {
            // ✅ MARK EMAIL AS VERIFIED
            $user->email_verified_at = now();
            $user->otp_code          = null;
            $user->otp_expires_at    = null;
            $user->save();

            // ✅ NOW CREATE DONOR/ORG PROFILE
            $data = json_decode($user->pending_data, true);

            if ($user->role === 'donor') {
                Donor::create([
                    'user_id'     => $user->id,
                    'first_name'  => $data['first_name'],
                    'middle_name' => $data['middle_name'],
                    'last_name'   => $data['last_name'],
                    'suffix'      => $data['suffix'],
                    'gender'      => $data['gender'],
                    'dob'         => $data['dob'],
                    'house'       => $data['house'],
                    'street'      => $data['street'],
                    'barangay'    => $data['barangay'],
                    'city'        => $data['city'],
                    'province'    => $data['province'],
                    'zip'         => $data['zip'],
                    'contact'     => $data['contact'],
                ]);
            } elseif ($user->role === 'organization') {
                Organization::create([
                    'user_id'        => $user->id,
                    'org_name'       => $data['org_name'],
                    'website'        => $data['website'],
                    'industry'       => $data['industry'],
                    'type'           => $data['type'],
                    'contact_person' => $data['contact_person'],
                    'contact'        => $data['contact'],
                ]);
            }

            // ✅ CLEAR pending_data
            $user->pending_data = null;
            $user->save();

            return response()->json(['message' => 'Email verified successfully!']);
        }

        return response()->json(['message' => 'Invalid or expired OTP.'], 422);
    }

    // ✅ RESEND OTP
    public function resendOtp(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        $this->sendOtp($user);

        return response()->json(['message' => 'OTP resent successfully.']);
    }

    // ✅ LOGIN
    // - Admin & Staff: login with username + password (no @ in identifier)
    // - Donor & Organization: login with email + password (has @ in identifier)
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string', // username OR email
            'password'   => 'required|string',
        ]);

        $identifier = $request->identifier;
        $isEmail    = str_contains($identifier, '@');

        if ($isEmail) {
            // ── DONOR / ORGANIZATION LOGIN ──
            $user = User::where('email', $identifier)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials.'], 401);
            }

            if (!in_array($user->role, ['donor', 'organization'])) {
                return response()->json(['message' => 'Please use your username to log in.'], 403);
            }

            if (!$user->email_verified_at) {
                return response()->json([
                    'message' => 'Please verify your email before logging in.',
                    'user_id' => $user->id,
                ], 403);
            }

        } else {
            // ── ADMIN / STAFF LOGIN ──
            $user = User::where('username', $identifier)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials.'], 401);
            }

            if (!in_array($user->role, ['admin', 'staff'])) {
                return response()->json(['message' => 'Please use your email to log in.'], 403);
            }
        }

        // ── RETURN ROLE SO FRONTEND CAN REDIRECT TO CORRECT DASHBOARD ──
        return response()->json([
            'message' => 'Login successful',
            'user'    => $user,
            'role'    => $user->role,
        ]);
    }

    // ✅ CREATE STAFF — Admin only
    public function createStaff(Request $request)
    {
        $request->validate([
            'name'     => 'required|string',
            'username' => 'required|string|unique:users,username',
            'password' => 'required|min:6|confirmed',
        ]);

        $staff = User::create([
            'name'              => $request->name,
            'username'          => $request->username,
            'password'          => Hash::make($request->password),
            'role'              => 'staff',
            'email_verified_at' => now(), // Staff are pre-verified, no OTP needed
        ]);

        return response()->json([
            'message' => 'Staff account created successfully.',
            'staff'   => $staff,
        ], 201);
    }

    // ✅ FORGOT PASSWORD — sends OTP to email (donors & orgs only)
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !in_array($user->role, ['donor', 'organization'])) {
            return response()->json(['message' => 'No account found with that email.'], 404);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code       = $otp;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();

        Mail::to($user->email)->send(new PasswordResetMail($otp, $user->name));

        return response()->json([
            'message' => 'Reset code sent to your email.',
            'user_id' => $user->id,
        ]);
    }

    // ✅ VERIFY RESET OTP
    public function verifyResetOtp(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp'     => 'required|string|size:6',
        ]);

        $user = User::findOrFail($request->user_id);

        if (
            $user->otp_code === $request->otp &&
            $user->otp_expires_at &&
            now()->lessThanOrEqualTo($user->otp_expires_at)
        ) {
            $user->otp_code       = null;
            $user->otp_expires_at = null;
            $user->save();

            return response()->json(['message' => 'OTP verified.']);
        }

        return response()->json(['message' => 'Invalid or expired code.'], 422);
    }

    // ✅ RESET PASSWORD
    public function resetPassword(Request $request)
    {
        $request->validate([
            'user_id'  => 'required|exists:users,id',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}