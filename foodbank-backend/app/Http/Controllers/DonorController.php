<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Models\Donor;
use App\Models\DonorOrganization;
use App\Models\FinancialDonation;
use App\Models\FinancialDonationRecord;
use App\Models\FoodDonationRecord;
use App\Models\ServiceDonationRecord;
use App\Mail\OtpMail;

class DonorController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // GET /donor/profile
    // Returns full merged profile (individual or organization)
    // ══════════════════════════════════════════════════════════════════
    public function profile(Request $request)
    {
        $user = $request->user();

        // Try individual donor first
        $donor = Donor::where('user_id', $user->id)->first();
        if ($donor) {
            return response()->json([
                'type'           => 'individual',
                'email'          => $user->email,
                'updated_at'     => $donor->updated_at ?? $user->updated_at,
                // Map model field names → frontend field names
                'first_name'     => $donor->first_name,
                'middle_name'    => $donor->middle_name,
                'last_name'      => $donor->last_name,
                'suffix'         => $donor->suffix,
                'gender'         => $donor->gender,
                'date_of_birth'  => $donor->dob,
                'house_number'   => $donor->house,
                'barangay'       => $donor->barangay,
                'street'         => $donor->street,
                'city'           => $donor->city,
                'province'       => $donor->province,
                'postal_code'    => $donor->zip,
                'contact_number' => $donor->contact,
            ]);
        }

        // Try organization donor
        $org = DonorOrganization::where('user_id', $user->id)->first();
        if ($org) {
            return response()->json([
                'type'           => 'organization',
                'email'          => $user->email,
                'updated_at'     => $org->updated_at ?? $user->updated_at,
                'org_name'       => $org->org_name,
                'website'        => $org->website,
                'industry'       => $org->industry,
                'org_type'       => $org->type,
                'first_name'     => $org->first_name,
                'last_name'      => $org->last_name,
                'contact'        => $org->contact,
            ]);
        }

        return response()->json(['email' => $user->email]);
    }

    // ══════════════════════════════════════════════════════════════════
    // PUT /donor/profile
    // Update individual or organization profile
    // ══════════════════════════════════════════════════════════════════
    public function updateProfile(Request $request)
    {
        $user  = $request->user();
        $donor = Donor::where('user_id', $user->id)->first();

        if ($donor) {
            $request->validate([
                'first_name' => 'required|string|max:100',
                'last_name'  => 'required|string|max:100',
                'email'      => 'required|email|unique:users,email,' . $user->id,
            ]);

            $donor->update([
                'first_name'  => $request->first_name,
                'middle_name' => $request->middle_name ?? $donor->middle_name,
                'last_name'   => $request->last_name,
                'suffix'      => $request->suffix ?? $donor->suffix,
                'gender'      => $request->gender ?? $donor->gender,
                'dob'         => $request->date_of_birth ?? $donor->dob,
                'house'       => $request->house_number ?? $donor->house,
                'barangay'    => $request->barangay ?? $donor->barangay,
                'street'      => $request->street ?? $donor->street,
                'city'        => $request->city ?? $donor->city,
                'province'    => $request->province ?? $donor->province,
                'zip'         => $request->postal_code ?? $donor->zip,
                'contact'     => $request->contact_number ?? $donor->contact,
            ]);

            // Update user email + name if changed
            $user->email = $request->email;
            $user->name  = $request->first_name . ' ' . $request->last_name;
            $user->save();

            return $this->profile($request);
        }

        $org = DonorOrganization::where('user_id', $user->id)->first();
        if ($org) {
            $request->validate([
                'org_name' => 'required|string|max:200',
                'email'    => 'required|email|unique:users,email,' . $user->id,
            ]);

            $org->update([
                'org_name'   => $request->org_name,
                'website'    => $request->website ?? $org->website,
                'industry'   => $request->industry ?? $org->industry,
                'type'       => $request->org_type ?? $org->type,
                'first_name' => $request->first_name ?? $org->first_name,
                'last_name'  => $request->last_name ?? $org->last_name,
                'contact'    => $request->contact ?? $org->contact,
            ]);

            $user->email = $request->email;
            $user->name  = $request->org_name;
            $user->save();

            return $this->profile($request);
        }

        return response()->json(['message' => 'Profile not found.'], 404);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /donor/change-password/send-otp
    // Generates a 6-digit OTP, stores in cache, emails it
    // ══════════════════════════════════════════════════════════════════
    public function sendChangePasswordOtp(Request $request)
    {
        $user = $request->user();
        $otp  = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP in cache keyed by user id (expires in 10 minutes)
        \Cache::put("change_pw_otp_{$user->id}", $otp, now()->addMinutes(10));

        // Send email
        Mail::to($user->email)->send(new OtpMail($otp, $user->name));

        return response()->json(['message' => 'OTP sent to your email.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /donor/change-password
    // Verifies OTP then sets new password
    // ══════════════════════════════════════════════════════════════════
    public function changePassword(Request $request)
    {
        $request->validate([
            'otp'                   => 'required|string|size:6',
            'password'              => 'required|min:6|confirmed',
            'password_confirmation' => 'required',
        ]);

        $user       = $request->user();
        $cachedOtp  = \Cache::get("change_pw_otp_{$user->id}");

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        \Cache::forget("change_pw_otp_{$user->id}");

        return response()->json(['message' => 'Password changed successfully.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /donor/deactivate
    // Revokes all tokens and soft-deletes the user
    // ══════════════════════════════════════════════════════════════════
    public function deactivate(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['message' => 'Account deactivated.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /donor/stats
    // ══════════════════════════════════════════════════════════════════
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $totalFinancial = FinancialDonation::where('user_id', $userId)->sum('amount');

        $totalFoodCount = FoodDonationRecord::where('user_id', $userId)
            ->where('status', 'approved')->count();

        $totalServiceCount = ServiceDonationRecord::where('user_id', $userId)
            ->where('status', 'approved')->count();

        $financialCount = FinancialDonationRecord::where('user_id', $userId)->count();
        $foodCount      = FoodDonationRecord::where('user_id', $userId)->count();
        $serviceCount   = ServiceDonationRecord::where('user_id', $userId)->count();

        return response()->json([
            'total_financial'     => (float) $totalFinancial,
            'total_food_count'    => $totalFoodCount,
            'total_service_count' => $totalServiceCount,
            'total_count'         => $financialCount + $foodCount + $serviceCount,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /donor/donations  — combined history
    // ══════════════════════════════════════════════════════════════════
    public function donations(Request $request)
    {
        $userId = $request->user()->id;
        $type   = $request->type  ?? 'All';
        $range  = $request->range ?? 'all_time';
        $from   = $request->from  ?? null;
        $to     = $request->to    ?? null;

        $rows = collect();

        if ($type === 'All' || $type === 'Financial') {
            $query = FinancialDonationRecord::where('user_id', $userId);
            $query = $this->applyDateFilter($query, 'created_at', $range, $from, $to);
            $rows  = $rows->merge(
                $query->get()->map(fn ($r) => [
                    'id'           => 'fin-' . $r->id,
                    'date'         => $r->donated_at
                        ? $r->donated_at->format('M d, Y')
                        : $r->created_at->format('M d, Y'),
                    'type'         => 'Financial',
                    'amount_items' => '₱ ' . number_format($r->amount, 0),
                    'status'       => ucfirst($r->status),
                    'raw_date'     => $r->created_at,
                ])
            );
        }

        if ($type === 'All' || $type === 'Food') {
            $query = FoodDonationRecord::with('items')->where('user_id', $userId);
            $query = $this->applyDateFilter($query, 'created_at', $range, $from, $to);
            $rows  = $rows->merge(
                $query->get()->map(function ($r) {
                    $itemCount = $r->items->count();
                    $summary   = $itemCount === 1
                        ? $r->items->first()->food_name
                        : "{$itemCount} food items";
                    return [
                        'id'           => 'food-' . $r->id,
                        'date'         => $r->created_at->format('M d, Y'),
                        'type'         => 'Food',
                        'amount_items' => $summary,
                        'status'       => ucfirst($r->status),
                        'raw_date'     => $r->created_at,
                    ];
                })
            );
        }

        if ($type === 'All' || $type === 'Service') {
            $query = ServiceDonationRecord::where('user_id', $userId);
            $query = $this->applyDateFilter($query, 'created_at', $range, $from, $to);
            $rows  = $rows->merge(
                $query->get()->map(fn ($r) => [
                    'id'           => 'svc-' . $r->id,
                    'date'         => $r->created_at->format('M d, Y'),
                    'type'         => 'Service',
                    'amount_items' => $r->service_type . ' ×' . $r->quantity,
                    'status'       => ucfirst($r->status),
                    'raw_date'     => $r->created_at,
                ])
            );
        }

        $sorted = $rows->sortByDesc('raw_date')->values()->map(function ($row) {
            unset($row['raw_date']);
            return $row;
        });

        return response()->json($sorted);
    }

    private function applyDateFilter($query, string $col, string $range, ?string $from, ?string $to)
    {
        switch ($range) {
            case 'this_week':
                $query->whereBetween($col, [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'this_month':
                $query->whereMonth($col, now()->month)->whereYear($col, now()->year);
                break;
            case 'this_year':
                $query->whereYear($col, now()->year);
                break;
            case 'custom':
                if ($from) $query->whereDate($col, '>=', $from);
                if ($to)   $query->whereDate($col, '<=', $to);
                break;
        }
        return $query;
    }
}
