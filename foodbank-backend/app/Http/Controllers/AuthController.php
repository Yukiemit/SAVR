<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Donor;
use App\Models\DonorOrganization;
use App\Models\Beneficiary;
use App\Models\BeneficiaryOrganization;
use App\Mail\OtpMail;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    private function sendOtp(User $user): void
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->otp_code       = $otp;
        $user->otp_expires_at = now()->addMinutes(10);
        $user->save();
        Mail::to($user->email)->send(new OtpMail($otp, $user->name));
    }

    public function register(Request $request)
    {
        $role = $request->role;

        if ($role === 'donor') {
            $request->validate([
                'first_name'  => 'required|string',
                'last_name'   => 'required|string',
                'middle_name' => 'nullable|string',
                'suffix'      => 'nullable|string',
                'email'       => 'required|email|unique:users',
                'password'    => 'required|min:6|confirmed',
            ]);
            $user = User::create([
                'name'         => $request->first_name . ' ' . $request->last_name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => 'donor',
                'pending_data' => json_encode([
                    'type'        => 'individual',
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

        } elseif ($role === 'donor_organization') {
            $request->validate([
                'org_name' => 'required|string',
                'email'    => 'required|email|unique:users',
                'password' => 'required|min:6|confirmed',
            ]);
            $user = User::create([
                'name'         => $request->org_name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => 'donor',
                'pending_data' => json_encode([
                    'type'           => 'organization',
                    'org_name'       => $request->org_name,
                    'website'        => $request->website,
                    'industry'       => $request->industry,
                    'type_org'       => $request->type,
                    'contact_person' => $request->contact_person,
                    'contact'        => $request->contact,
                ]),
            ]);

        } elseif ($role === 'beneficiary') {
            $request->validate([
                'first_name'  => 'required|string',
                'last_name'   => 'required|string',
                'middle_name' => 'nullable|string',
                'suffix'      => 'nullable|string',
                'email'       => 'required|email|unique:users',
                'password'    => 'required|min:6|confirmed',
            ]);
            $user = User::create([
                'name'         => $request->first_name . ' ' . $request->last_name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => 'beneficiary',
                'pending_data' => json_encode([
                    'type'        => 'individual',
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

        } elseif ($role === 'beneficiary_organization') {
            $request->validate([
                'org_name' => 'required|string',
                'email'    => 'required|email|unique:users',
                'password' => 'required|min:6|confirmed',
            ]);
            $user = User::create([
                'name'         => $request->org_name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => 'beneficiary',
                'pending_data' => json_encode([
                    'type'           => 'organization',
                    'org_name'       => $request->org_name,
                    'website'        => $request->website,
                    'industry'       => $request->industry,
                    'type_org'       => $request->type,
                    'contact_person' => $request->contact_person,
                    'contact'        => $request->contact,
                ]),
            ]);

        } else {
            return response()->json(['message' => 'Invalid role.'], 422);
        }

        $this->sendOtp($user);

        return response()->json([
            'message' => 'Registration successful. Please check your email for the OTP.',
            'user_id' => $user->id,
        ], 201);
    }

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
            $user->email_verified_at = now();
            $user->otp_code          = null;
            $user->otp_expires_at    = null;
            $user->save();

            $data    = json_decode($user->pending_data, true);
            $subType = $data['type'] ?? 'individual';

            if ($user->role === 'donor') {
                if ($subType === 'individual') {
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
                } else {
                    DonorOrganization::create([
                        'user_id'        => $user->id,
                        'org_name'       => $data['org_name'],
                        'website'        => $data['website'],
                        'industry'       => $data['industry'],
                        'type'           => $data['type_org'],
                        'contact_person' => $data['contact_person'],
                        'contact'        => $data['contact'],
                    ]);
                }
            } elseif ($user->role === 'beneficiary') {
                if ($subType === 'individual') {
                    Beneficiary::create([
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
                } else {
                    BeneficiaryOrganization::create([
                        'user_id'        => $user->id,
                        'org_name'       => $data['org_name'],
                        'website'        => $data['website'],
                        'industry'       => $data['industry'],
                        'type'           => $data['type_org'],
                        'contact_person' => $data['contact_person'],
                        'contact'        => $data['contact'],
                    ]);
                }
            }

            $user->pending_data = null;
            $user->save();

            return response()->json(['message' => 'Email verified successfully!']);
        }

        return response()->json(['message' => 'Invalid or expired OTP.'], 422);
    }

    public function resendOtp(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $user = User::findOrFail($request->user_id);
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }
        $this->sendOtp($user);
        return response()->json(['message' => 'OTP resent successfully.']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password'   => 'required|string',
        ]);

        $identifier = $request->identifier;
        $isEmail    = str_contains($identifier, '@');

        if ($isEmail) {
            $user = User::where('email', $identifier)->first();
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials.'], 401);
            }
            if (!in_array($user->role, ['donor', 'beneficiary', 'organization'])) {
                return response()->json(['message' => 'Please use your username to log in.'], 403);
            }
            if (!$user->email_verified_at) {
                return response()->json([
                    'message' => 'Please verify your email before logging in.',
                    'user_id' => $user->id,
                ], 403);
            }
        } else {
            $user = User::where('username', $identifier)->first();
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials.'], 401);
            }
            if (!in_array($user->role, ['admin', 'staff'])) {
                return response()->json(['message' => 'Please use your email to log in.'], 403);
            }
        }

        // ✅ FIXED: generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $user,
            'role'    => $user->role,
        ]);
    }

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
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Staff account created successfully.',
            'staff'   => $staff,
        ], 201);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user || !in_array($user->role, ['donor', 'beneficiary'])) {
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

    public function logout(Request $request)
    {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out successfully.']);
    }
}