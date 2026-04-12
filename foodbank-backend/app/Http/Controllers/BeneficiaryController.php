<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Models\Beneficiary;
use App\Models\BeneficiaryOrganization;
use App\Models\BeneficiaryRequest;
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
                'org_type'   => $org->type,
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
                'type'            => $request->org_type        ?? $org->type,
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
        $user  = $request->user();
        $ben   = Beneficiary::where('user_id', $user->id)->first();

        $firstName = $ben?->first_name ?? '';
        $lastName  = $ben?->last_name  ?? '';
        $fullName  = trim("$firstName $lastName") ?: $user->name;

        $allRequests   = BeneficiaryRequest::where('user_id', $user->id)->get();
        $totalRequests = $allRequests->count();
        $pendingCount  = $allRequests->where('status', 'Pending')->count();
        $activeCount   = $allRequests->where('status', 'Allocated')->count();

        $recentRequests = BeneficiaryRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'request_name' => $r->request_name,
                'type'         => $r->type,
                'date'         => $r->request_date
                    ? \Carbon\Carbon::parse($r->request_date)->format('M d, Y')
                    : '—',
                'amount_items' => $r->type === 'food'
                    ? "{$r->quantity} {$r->unit} of {$r->food_type}"
                    : '₱' . number_format((float)$r->amount, 2),
                'status'       => strtolower($r->status),
                'urgency'      => $r->urgency,
            ]);

        return response()->json([
            'name'            => $fullName,
            'first_name'      => $firstName,
            'last_name'       => $lastName,
            'total_requests'  => $totalRequests,
            'active_count'    => $activeCount,
            'pending_count'   => $pendingCount,
            'recent_requests' => $recentRequests,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /beneficiary/requests
    // Beneficiary submits a food or financial assistance request
    // ══════════════════════════════════════════════════════════════════
    public function submitRequest(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'type'         => 'required|in:food,financial',
            'request_name' => 'required|string|max:255',
            'population'   => 'required|integer|min:1',
            'age_range_min' => 'required|integer|min:0',
            'age_range_max' => 'required|integer|min:0|gte:age_range_min',
            'street'       => 'required|string',
            'barangay'     => 'required|string',
            'city'         => 'required|string',
            'zip_code'     => 'required|string',
            'request_date' => 'required|date',
            'urgency'      => 'required|in:low,medium,high',
            // food-specific
            'food_type'    => 'required_if:type,food|nullable|string',
            'quantity'     => 'required_if:type,food|nullable|numeric|min:1',
            'unit'         => 'required_if:type,food|nullable|string',
            // financial-specific
            'amount'       => 'required_if:type,financial|nullable|numeric|min:1',
        ]);

        $req = BeneficiaryRequest::create([
            'user_id'      => $user->id,
            'type'         => $request->type,
            'request_name' => $request->request_name,
            'food_type'    => $request->food_type,
            'quantity'     => $request->quantity,
            'unit'         => $request->unit,
            'amount'       => $request->amount,
            'population'   => $request->population,
            'age_min'      => $request->age_range_min,
            'age_max'      => $request->age_range_max,
            'street'       => $request->street,
            'barangay'     => $request->barangay,
            'city'         => $request->city,
            'zip_code'     => $request->zip_code,
            'request_date' => $request->request_date,
            'urgency'      => $request->urgency,
            'status'       => 'Pending',
        ]);

        return response()->json([
            'message' => 'Request submitted successfully.',
            'data'    => $req,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /beneficiary/requests
    // Returns all requests for the authenticated beneficiary
    // ══════════════════════════════════════════════════════════════════
    public function getRequests(Request $request)
    {
        $user = $request->user();

        $requests = BeneficiaryRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'request_name' => $r->request_name,
                'type'         => $r->type,
                'food_type'    => $r->food_type,
                'quantity'     => $r->quantity,
                'unit'         => $r->unit,
                'amount'       => $r->amount,
                'population'   => $r->population,
                'age_range_min' => $r->age_min,
                'age_range_max' => $r->age_max,
                'city'         => $r->city,
                'zip_code'     => $r->zip_code,
                'request_date' => $r->request_date,
                'urgency'      => $r->urgency,
                'status'       => strtolower($r->status), // pending | allocated | rejected
            ]);

        return response()->json($requests);
    }

    // ══════════════════════════════════════════════════════════════════
    // DELETE /beneficiary/requests/{id}
    // Cancel a pending request (only allowed if status = Pending)
    // ══════════════════════════════════════════════════════════════════
    public function cancelRequest(Request $request, $id)
    {
        $user = $request->user();

        $req = BeneficiaryRequest::where('id', $user->id === $request->user()->id ? $id : null)
                                  ->where('user_id', $user->id)
                                  ->firstOrFail();

        if ($req->status !== 'Pending') {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 403);
        }

        $req->delete();

        return response()->json(['message' => 'Request cancelled.']);
    }
}
