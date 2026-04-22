<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Staff;

class StaffController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // GET /staff/profile
    // Reads from the `staff` table (profile data), users table (auth)
    // ══════════════════════════════════════════════════════════════════
    public function profile(Request $request)
    {
        $user  = $request->user();
        $staff = Staff::where('user_id', $user->id)->first();

        return response()->json([
            'id'         => $user->id,
            'name'       => $staff
                ? trim("{$staff->first_name} {$staff->last_name}")
                : ($user->name ?? 'Staff'),
            'first_name' => $staff?->first_name  ?? $user->first_name,
            'middle_name'=> $staff?->middle_name ?? $user->middle_name,
            'last_name'  => $staff?->last_name   ?? $user->last_name,
            'username'   => $user->username,
            'email'      => $user->email,
            'contact'    => $staff?->contact     ?? $user->contact,
            'role'       => $user->role,
            'department' => $staff?->department  ?? $user->department,
            'gender'     => $staff?->gender      ?? $user->gender,
            'dob'        => $staff?->dob         ?? $user->dob,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // PUT /staff/profile
    // Writes to the `staff` table; syncs name to `users` for NavBar
    // ══════════════════════════════════════════════════════════════════
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'first_name'  => 'nullable|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name'   => 'nullable|string|max:100',
            'contact'     => 'nullable|string|max:30',
            'department'  => 'nullable|string|max:100',
            'gender'      => 'nullable|string|max:20',
            'dob'         => 'nullable|date',
        ]);

        $profileData = [
            'first_name'  => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name'   => $request->last_name,
            'contact'     => $request->contact,
            'department'  => $request->department,
            'gender'      => $request->gender,
            'dob'         => $request->dob,
        ];

        // Upsert staff profile row
        $staff = Staff::updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        // Sync display name to users table so NavBar stays accurate
        $fullName = trim("{$request->first_name} {$request->last_name}");
        if ($fullName) {
            $user->update(['name' => $fullName]);
        }

        return response()->json([
            'message'    => 'Profile updated successfully.',
            'first_name' => $staff->first_name,
            'middle_name'=> $staff->middle_name,
            'last_name'  => $staff->last_name,
            'contact'    => $staff->contact,
            'department' => $staff->department,
            'gender'     => $staff->gender,
            'dob'        => $staff->dob,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /staff/change-password
    // ══════════════════════════════════════════════════════════════════
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /staff/dashboard/stats
    // ══════════════════════════════════════════════════════════════════
    public function dashboardStats()
    {
        $stats = Cache::remember('staff_dashboard_stats', 60, function () {
            // Single round-trip to Railway instead of 7 separate queries
            $row = DB::selectOne("
                SELECT
                    (SELECT COUNT(*) FROM food_donation_records      WHERE status = 'received') +
                    (SELECT COUNT(*) FROM financial_donation_records  WHERE status = 'approved') +
                    (SELECT COUNT(*) FROM service_donation_records    WHERE status = 'accepted')
                        AS total_donations,
                    (SELECT COUNT(*)  FROM donation_drives)           AS total_drives,
                    (SELECT COALESCE(SUM(amount), 0)
                       FROM financial_donation_records               WHERE status = 'approved')
                        AS total_amount_donated,
                    (SELECT COUNT(*) FROM beneficiary_requests
                       WHERE status IN ('Allocated','Done')) +
                    (SELECT COUNT(*) FROM donation_requests
                       WHERE status IN ('Allocated','Done'))
                        AS approved_requests
            ");

            return [
                'total_donations'      => (int)   $row->total_donations,
                'total_drives'         => (int)   $row->total_drives,
                'total_amount_donated' => (float) $row->total_amount_donated,
                'approved_requests'    => (int)   $row->approved_requests,
            ];
        });

        return response()->json($stats);
    }
}
