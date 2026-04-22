<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;

class AdminController extends Controller
{
    // ══════════════════════════════════════════════════════════════════
    // GET /admin/profile
    // Reads from the `admins` table (profile data), users table (auth)
    // ══════════════════════════════════════════════════════════════════
    public function profile(Request $request)
    {
        $user  = $request->user();
        $admin = Admin::where('user_id', $user->id)->first();

        return response()->json([
            'id'          => $user->id,
            'name'        => $admin
                ? trim("{$admin->first_name} {$admin->last_name}")
                : ($user->name ?? 'Admin'),
            'first_name'  => $admin?->first_name  ?? $user->first_name,
            'middle_name' => $admin?->middle_name ?? $user->middle_name,
            'last_name'   => $admin?->last_name   ?? $user->last_name,
            'username'    => $user->username,
            'email'       => $user->email,
            'contact'     => $admin?->contact     ?? $user->contact,
            'role'        => $user->role,
            'department'  => $admin?->department  ?? $user->department,
            'gender'      => $admin?->gender      ?? $user->gender,
            'dob'         => $admin?->dob         ?? $user->dob,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // PUT /admin/profile
    // Writes to the `admins` table; syncs name to `users` for NavBar
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

        // Upsert admin profile row
        $admin = Admin::updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        // Sync display name to users table so NavBar stays accurate
        $fullName = trim("{$request->first_name} {$request->last_name}");
        if ($fullName) {
            $user->update(['name' => $fullName]);
        }

        return response()->json([
            'message'     => 'Profile updated successfully.',
            'first_name'  => $admin->first_name,
            'middle_name' => $admin->middle_name,
            'last_name'   => $admin->last_name,
            'contact'     => $admin->contact,
            'department'  => $admin->department,
            'gender'      => $admin->gender,
            'dob'         => $admin->dob,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════
    // POST /admin/change-password
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
    // GET /admin/dashboard/stats
    // ══════════════════════════════════════════════════════════════════
    public function dashboardStats()
    {
        $stats = Cache::remember('admin_dashboard_stats', 60, function () {
            // Single round-trip to Railway instead of multiple separate queries
            $row = DB::selectOne("
                SELECT
                    (SELECT COALESCE(SUM(amount), 0)
                       FROM financial_donation_records WHERE status = 'approved')
                        AS total_donations,
                    (SELECT COUNT(*) FROM beneficiary_requests WHERE status = 'Done')
                        AS meals_served,
                    (SELECT COUNT(*) FROM donation_drives WHERE status = 'OnGoing')
                        AS active_drives
            ");

            return [
                'total_donations' => (float) $row->total_donations,
                'meals_served'    => (int)   $row->meals_served,
                'active_drives'   => (int)   $row->active_drives,
            ];
        });

        return response()->json($stats);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /admin/drives
    // Active drives for the dashboard carousel
    // ══════════════════════════════════════════════════════════════════
    public function getDrives()
    {
        $drives = Cache::remember('admin_drives_list', 30, function () {
            $rows = DB::select("
                SELECT id, drive_title AS title, type,
                       goal AS goal_label,
                       start_date, end_date,
                       address, contact_person,
                       contact AS contact_number,
                       email AS contact_email,
                       status,
                       0 AS current,
                       0 AS goal
                FROM donation_drives
                WHERE status IN ('Pending','OnGoing')
                ORDER BY created_at DESC
            ");
            return array_map(fn($r) => (array) $r, $rows);
        });

        return response()->json($drives);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /admin/charts/donation-trends  (last 30 days)
    // ══════════════════════════════════════════════════════════════════
    public function chartDonationTrends()
    {
        $data = Cache::remember('admin_chart_trends', 60, function () {
            $rows = DB::select("
                SELECT
                    TO_CHAR(updated_at::date, 'Mon DD') AS label,
                    COALESCE(SUM(amount), 0)            AS value
                FROM financial_donation_records
                WHERE status = 'approved'
                  AND updated_at >= NOW() - INTERVAL '30 days'
                GROUP BY updated_at::date
                ORDER BY updated_at::date
            ");

            return [
                'labels' => array_column($rows, 'label'),
                'values' => array_map(fn($r) => (float) $r->value, $rows),
            ];
        });

        return response()->json($data);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /admin/charts/donation-types
    // ══════════════════════════════════════════════════════════════════
    public function chartDonationTypes()
    {
        $data = Cache::remember('admin_chart_types', 60, function () {
            $row = DB::selectOne("
                SELECT
                    (SELECT COUNT(*) FROM food_donation_records     WHERE status = 'received') AS food,
                    (SELECT COUNT(*) FROM financial_donation_records WHERE status = 'approved') AS financial,
                    (SELECT COUNT(*) FROM service_donation_records   WHERE status = 'accepted') AS service
            ");

            return [
                'labels' => ['Food', 'Financial', 'Service'],
                'values' => [(int)$row->food, (int)$row->financial, (int)$row->service],
            ];
        });

        return response()->json($data);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /admin/charts/beneficiary-types
    // ══════════════════════════════════════════════════════════════════
    public function chartBeneficiaryTypes()
    {
        $data = Cache::remember('admin_chart_beneficiary', 60, function () {
            $rows = DB::select("
                SELECT
                    COALESCE(type, 'Unknown') AS label,
                    COUNT(*) AS value
                FROM beneficiary_requests
                GROUP BY type
                ORDER BY value DESC
                LIMIT 5
            ");

            return [
                'labels' => array_column($rows, 'label'),
                'values' => array_map(fn($r) => (int) $r->value, $rows),
            ];
        });

        return response()->json($data);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /admin/charts/distribution-by-region
    // ══════════════════════════════════════════════════════════════════
    public function chartDistributionByRegion()
    {
        $data = Cache::remember('admin_chart_region', 60, function () {
            // Group financial donations by address/region from donation drives
            $rows = DB::select("
                SELECT
                    COALESCE(dd.address, 'Unknown') AS label,
                    COALESCE(SUM(CASE WHEN dd.type = 'Financial' THEN 1 ELSE 0 END), 0) AS financial,
                    COALESCE(SUM(CASE WHEN dd.type = 'Food'      THEN 1 ELSE 0 END), 0) AS food,
                    COALESCE(SUM(CASE WHEN dd.type NOT IN ('Financial','Food') THEN 1 ELSE 0 END), 0) AS other
                FROM donation_drives dd
                GROUP BY dd.address
                ORDER BY (financial + food + other) DESC
                LIMIT 8
            ");

            return [
                'labels'    => array_column($rows, 'label'),
                'financial' => array_map(fn($r) => (int) $r->financial, $rows),
                'food'      => array_map(fn($r) => (int) $r->food,      $rows),
                'other'     => array_map(fn($r) => (int) $r->other,     $rows),
            ];
        });

        return response()->json($data);
    }

    // ══════════════════════════════════════════════════════════════════
    // GET /admin/notifications
    // ══════════════════════════════════════════════════════════════════
    public function notifications()
    {
        return response()->json([]);
    }
}
