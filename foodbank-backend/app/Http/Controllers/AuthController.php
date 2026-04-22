<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Donor;
use App\Models\DonorOrganization;
use App\Models\Beneficiary;
use App\Models\BeneficiaryOrganization;
use App\Models\Staff;
use App\Models\Admin;
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

    /**
     * If the email already exists but was never verified, delete that
     * stale record so the new registration can proceed cleanly.
     * Throws a validation error if the email belongs to a verified account.
     */
    private function clearUnverifiedOrFail(string $email): void
    {
        $existing = User::where('email', $email)->first();
        if (!$existing) return;

        if ($existing->email_verified_at) {
            // Already a real account — surface the normal "taken" error
            abort(response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => ['email' => ['The email has already been taken.']],
            ], 422));
        }

        // Unverified stale record — remove it so registration can proceed
        $existing->delete();
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
                'email'       => 'required|email',
                'password'    => 'required|min:6|confirmed',
            ]);
            $this->clearUnverifiedOrFail($request->email);
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
                'email'    => 'required|email',
                'password' => 'required|min:6|confirmed',
            ]);
            $this->clearUnverifiedOrFail($request->email);
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
                'email'       => 'required|email',
                'password'    => 'required|min:6|confirmed',
            ]);
            $this->clearUnverifiedOrFail($request->email);
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
                'email'    => 'required|email',
                'password' => 'required|min:6|confirmed',
            ]);
            $this->clearUnverifiedOrFail($request->email);
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

            // Clear pending_data AND profile fields from users —
            // profile data now lives exclusively in the role-specific table
            $user->pending_data = null;
            $user->first_name   = null;
            $user->middle_name  = null;
            $user->last_name    = null;
            $user->suffix       = null;
            $user->gender       = null;
            $user->dob          = null;
            $user->house        = null;
            $user->street       = null;
            $user->barangay     = null;
            $user->city         = null;
            $user->province     = null;
            $user->zip          = null;
            $user->contact      = null;
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

        // Detect individual vs organization sub-type
        $subType = 'individual';
        if ($user->role === 'donor') {
            $isOrg   = DonorOrganization::where('user_id', $user->id)->exists();
            $subType = $isOrg ? 'organization' : 'individual';
        } elseif ($user->role === 'beneficiary') {
            $isOrg   = BeneficiaryOrganization::where('user_id', $user->id)->exists();
            $subType = $isOrg ? 'organization' : 'individual';
        }

        return response()->json([
            'message'  => 'Login successful',
            'token'    => $token,
            'user'     => $user,
            'role'     => $user->role,
            'sub_type' => $subType,   // "individual" | "organization"
        ]);
    }

    public function createStaff(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'username'   => 'required|string|unique:users,username',
            'password'   => 'required|min:6|confirmed',
            'department' => 'nullable|string|max:100',
        ]);

        $fullName = trim("{$request->first_name} {$request->last_name}");

        $user = User::create([
            'name'              => $fullName,
            'username'          => $request->username,
            'password'          => Hash::make($request->password),
            'role'              => 'staff',
            'email_verified_at' => now(),
        ]);

        // Create staff profile row
        Staff::create([
            'user_id'    => $user->id,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'department' => $request->department,
        ]);

        return response()->json([
            'message' => 'Staff account created successfully.',
            'staff'   => $user,
        ], 201);
    }

    public function createAdmin(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'username'   => 'required|string|unique:users,username',
            'password'   => 'required|min:6|confirmed',
            'department' => 'nullable|string|max:100',
        ]);

        $fullName = trim("{$request->first_name} {$request->last_name}");

        $user = User::create([
            'name'              => $fullName,
            'username'          => $request->username,
            'password'          => Hash::make($request->password),
            'role'              => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create admin profile row
        Admin::create([
            'user_id'    => $user->id,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'department' => $request->department,
        ]);

        return response()->json([
            'message' => 'Admin account created successfully.',
            'admin'   => $user,
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