<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Models\Beneficiary;
use App\Models\BeneficiaryOrganization;
use App\Mail\OtpMail;

class BeneficiaryController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // GET /beneficiary/profile
    // ══════════════════════════════════════════════════════════════════
    public function profile(Request $request)
    {
        $user = $request->user();

        $ben = Beneficiary::where('user_id', $user->id)->first();
        if ($ben) {
            return response()->json(array_merge($ben->toArray(), [
                'type'       => 'individual',
                'email'      => $user->email,
                'updated_at' => $ben->updated_at ?? $user->updated_at,
            ]));
        }

        $org = BeneficiaryOrganization::where('user_id', $user->id)->first();
        if ($org) {
            return response()->json(array_merge($org->toArray(), [
                'type'       => 'organization',
                'email'      => $org->email ?? $user->email,
                'updated_at' => $org->updated_at ?? $user->updated_at,
            ]));
        }

        return response()->json(['email' => $user->email]);
    }

    // ══════════════════════════════════════════════════════════════════
    // PUT /beneficiary/profile
    // ══════════════════════════════════════════════════════════════════
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $ben = Beneficiary::where('user_id', $user->id)->first();
        if ($ben) {
            $request->validate([
                'first_name' => 'required|string|max:100',
                'last_name'  => 'required|string|max:100',
                'email'      => 'required|email|unique:users,email,' . $user->id,
            ]);

            $ben->update([
                'first_name'  => $request->first_name,
                'middle_name' => $request->middle_name ?? $ben->middle_name,
                'last_name'   => $request->last_name,
                'suffix'      => $request->suffix      ?? $ben->suffix,
                'gender'      => $request->gender      ?? $ben->gender,
                'dob'         => $request->dob         ?? $ben->dob,
                'house'       => $request->house       ?? $ben->house,
                'barangay'    => $request->barangay    ?? $ben->barangay,
                'street'      => $request->street      ?? $ben->street,
                'city'        => $request->city        ?? $ben->city,
                'province'    => $request->province    ?? $ben->province,
                'zip'         => $request->zip         ?? $ben->zip,
                'contact'     => $request->contact     ?? $ben->contact,
            ]);

            $user->email = $request->email;
            $user->name  = $request->first_name . ' ' . $request->last_name;
            $user->save();

            return $this->profile($request);
        }

        $org = BeneficiaryOrganization::where('user_id', $user->id)->first();
        if ($org) {
            $request->validate([
                'org_name' => 'required|string|max:200',
            ]);

            $org->update([
                'org_name'        => $request->org_name,
                'website'         => $request->website        ?? $org->website,
                'type'            => $request->type           ?? $org->type,
                'sector'          => $request->sector         ?? $org->sector,
                'house'           => $request->house          ?? $org->house,
                'barangay'        => $request->barangay       ?? $org->barangay,
                'street'          => $request->street         ?? $org->street,
                'city'            => $request->city           ?? $org->city,
                'province'        => $request->province       ?? $org->province,
                'zip'             => $request->zip            ?? $org->zip,
                'first_name'      => $request->first_name     ?? $org->first_name,
                'last_name'       => $request->last_name      ?? $org->last_name,
                'position'        => $request->position       ?? $org->position,
                'contact'         => $request->contact        ?? $org->contact,
                'email'           => $request->email          ?? $org->email,
                'count_infants'   => $request->count_infants  ?? $org->count_infants,
                'count_children'  => $request->count_children ?? $org->count_children,
                'count_teenagers' => $request->count_teenagers ?? $org->count_teenagers,
                'count_adults'    => $request->count_adults   ?? $org->count_adults,
                'count_seniors'   => $request->count_seniors  ?? $org->count_seniors,
                'count_pwd'       => $request->count_pwd      ?? $org->count_pwd,
                'count_pregnant'  => $request->count_pregnant ?? $org->count_pregnant,
            ]);

            $user->name = $request->org_name;
            $user->save();

            return $this->profile($request);
        }

        return response()->json(['message' => 'Profile not found.'], 404);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /beneficiary/change-password/send-otp
    // Generates a 6-digit OTP, stores in cache, emails it
    // ══════════════════════════════════════════════════════════════════
    public function sendChangePasswordOtp(Request $request)
    {
        $user = $request->user();
        $otp  = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        \Cache::put("change_pw_otp_{$user->id}", $otp, now()->addMinutes(10));

        Mail::to($user->email)->send(new OtpMail($otp, $user->name));

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /beneficiary/change-password
    // Verifies OTP then sets new password
    // ══════════════════════════════════════════════════════════════════
    public function changePassword(Request $request)
    {
        $request->validate([
            'otp'                   => 'required|string|size:6',
            'password'              => 'required|min:6|confirmed',
            'password_confirmation' => 'required',
        ]);

        $user      = $request->user();
        $cachedOtp = \Cache::get("change_pw_otp_{$user->id}");

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        \Cache::forget("change_pw_otp_{$user->id}");

        return response()->json(['message' => 'Password changed successfully.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /beneficiary/deactivate
    // ══════════════════════════════════════════════════════════════════
    public function deactivate(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'Account deactivated.']);
    }

    // GET /api/beneficiary/dashboard
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $ben  = Beneficiary::where('user_id', $user->id)->first();

        $firstName = $ben?->first_name ?? '';
        $lastName  = $ben?->last_name  ?? '';
        $fullName  = trim("$firstName $lastName") ?: $user->name;

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
