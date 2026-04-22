<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\FoodDonationController;
use App\Http\Controllers\FinancialDonationController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\ServiceDonationController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\AdminController;

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
Route::post('/register',         [AuthController::class, 'register']);
Route::post('/verify-otp',       [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp',       [AuthController::class, 'resendOtp']);
Route::post('/login',            [AuthController::class, 'login']);
Route::post('/forgot-password',  [AuthController::class, 'forgotPassword']);
Route::post('/verify-reset-otp', [AuthController::class, 'verifyResetOtp']);
Route::post('/reset-password',   [AuthController::class, 'resetPassword']);

// ── PROTECTED ROUTES (requires login) ────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // ── Beneficiary ─────────────────────────────────────────────────────────
    Route::get('/beneficiary/profile',                    [BeneficiaryController::class, 'profile']);
    Route::put('/beneficiary/profile',                    [BeneficiaryController::class, 'updateProfile']);
    Route::post('/beneficiary/change-password/send-otp',  [BeneficiaryController::class, 'sendChangePasswordOtp']);
    Route::post('/beneficiary/change-password',           [BeneficiaryController::class, 'changePassword']);
    Route::post('/beneficiary/deactivate',                [BeneficiaryController::class, 'deactivate']);
    Route::get('/beneficiary/dashboard',                  [BeneficiaryController::class, 'dashboard']);

    // ── Beneficiary — Requests ───────────────────────────────────────────────
    Route::post('/beneficiary/requests',          [BeneficiaryController::class, 'submitRequest']);
    Route::get('/beneficiary/requests',           [BeneficiaryController::class, 'getRequests']);
    Route::delete('/beneficiary/requests/{id}',   [BeneficiaryController::class, 'cancelRequest']);

    // ── Donor — Profile ───────────────────────────────────────────────────────
    Route::get('/donor/profile',                        [DonorController::class, 'profile']);
    Route::put('/donor/profile',                        [DonorController::class, 'updateProfile']);
    Route::post('/donor/change-password/send-otp',      [DonorController::class, 'sendChangePasswordOtp']);
    Route::post('/donor/change-password',               [DonorController::class, 'changePassword']);
    Route::post('/donor/deactivate',                    [DonorController::class, 'deactivate']);

    // ── Donor — Stats, Combined History ──────────────────────────────────────
    Route::get('/donor/stats',      [DonorController::class, 'stats']);
    Route::get('/donor/donations',  [DonorController::class, 'donations']);

    // ── Donor — Food Donation (pending staff approval → inventory on approve) ─
    Route::post('/donor/donations/food', [FoodDonationController::class, 'store']);
    Route::get('/donor/donations/food',  [FoodDonationController::class, 'index']);

    // ── Donor — Service Donation (pending staff approval) ────────────────────
    Route::post('/donor/donations/service', [ServiceDonationController::class, 'store']);
    Route::get('/donor/donations/service',  [ServiceDonationController::class, 'index']);

    // ── Donor — Financial Donation: Manual (receipt upload → staff reviews) ──
    Route::post('/donor/donations',               [FinancialDonationController::class, 'store']);
    Route::get('/donor/donations/financial',      [FinancialDonationController::class, 'index']);

    // ── Donor — Financial Donation: PayMongo (creates link → auto-approved by webhook) ──
    Route::post('/donor/donations/paymongo',      [FinancialDonationController::class, 'createPaymentLink']);

    // ── Staff — Profile & Dashboard ──────────────────────────────────────────
    Route::get('/staff/profile',          [StaffController::class, 'profile']);
    Route::put('/staff/profile',          [StaffController::class, 'updateProfile']);
    Route::post('/staff/change-password', [StaffController::class, 'changePassword']);
    Route::get('/staff/dashboard/stats',  [StaffController::class, 'dashboardStats']);

    // ── Admin — Profile & Dashboard ───────────────────────────────────────────
    Route::get('/admin/profile',                          [AdminController::class, 'profile']);
    Route::put('/admin/profile',                          [AdminController::class, 'updateProfile']);
    Route::post('/admin/change-password',                 [AdminController::class, 'changePassword']);
    Route::get('/admin/dashboard/stats',                  [AdminController::class, 'dashboardStats']);
    Route::get('/admin/drives',                           [AdminController::class, 'getDrives']);
    Route::get('/admin/charts/donation-trends',           [AdminController::class, 'chartDonationTrends']);
    Route::get('/admin/charts/donation-types',            [AdminController::class, 'chartDonationTypes']);
    Route::get('/admin/charts/beneficiary-types',         [AdminController::class, 'chartBeneficiaryTypes']);
    Route::get('/admin/charts/distribution-by-region',   [AdminController::class, 'chartDistributionByRegion']);
    Route::get('/admin/notifications',                    [AdminController::class, 'notifications']);

    // ── Staff — Food Donation Records ────────────────────────────────────────
    Route::get('/staff/food-donation-records',               [FoodDonationController::class,      'getRecords']);
    Route::get('/staff/food-donation-records/stats',         [FoodDonationController::class,      'getRecordStats']);
    Route::post('/staff/food-donation-records/{id}/approve', [FoodDonationController::class,      'approveRecord']);
    Route::post('/staff/food-donation-records/{id}/reject',  [FoodDonationController::class,      'rejectRecord']);

    // ── Staff — Financial Donation Records ───────────────────────────────────
    Route::get('/staff/financial-donation-records',               [FinancialDonationController::class, 'getRecords']);
    Route::get('/staff/financial-donation-records/stats',         [FinancialDonationController::class, 'getRecordStats']);
    Route::post('/staff/financial-donation-records/{id}/approve', [FinancialDonationController::class, 'approveRecord']);
    Route::post('/staff/financial-donation-records/{id}/reject',  [FinancialDonationController::class, 'rejectRecord']);

    // ── Staff — Service Donations ─────────────────────────────────────────────
    Route::get('/staff/service-donations',                  [ServiceDonationController::class, 'getRecords']);
    Route::get('/staff/service-donations/stats',            [ServiceDonationController::class, 'getRecordStats']);
    Route::post('/staff/service-donations/{id}/accept',     [ServiceDonationController::class, 'acceptRecord']);
    Route::post('/staff/service-donations/{id}/decline',    [ServiceDonationController::class, 'declineRecord']);

    // ── Staff — Service Inventory (accepted donations) ────────────────────────
    Route::get('/staff/inventory/services',                        [ServiceDonationController::class, 'getServiceInventory']);
    Route::patch('/staff/inventory/services/{id}/status',          [ServiceDonationController::class, 'updateServiceInventoryStatus']);

    // Legacy aliases (keep for backward compat)
    Route::get('/staff/service-donation-records',               [ServiceDonationController::class, 'getRecords']);
    Route::get('/staff/service-donation-records/stats',         [ServiceDonationController::class, 'getRecordStats']);
    Route::post('/staff/service-donation-records/{id}/approve', [ServiceDonationController::class, 'acceptRecord']);
    Route::post('/staff/service-donation-records/{id}/reject',  [ServiceDonationController::class, 'declineRecord']);

    // ── Donor pickup stubs (route exists, feature not yet built) ────────────
    Route::get('/donor/pickups',        fn() => response()->json([]));
    Route::put('/donor/pickups/{id}',   fn() => response()->json(['message' => 'ok']));
    Route::delete('/donor/pickups/{id}',fn() => response()->json(['message' => 'ok']));

    // ── Notification stubs (prevents 404 errors in NavBar) ──────────────────
    Route::get('/notifications',                 fn() => response()->json([]));
    Route::post('/notifications/mark-all-read',  fn() => response()->json(['message' => 'ok']));
    Route::post('/notifications/{id}/mark-read', fn() => response()->json(['message' => 'ok']));
});

// ── PAYMONGO WEBHOOK (public — no auth, PayMongo calls this) ─────────────────
Route::post('/paymongo/webhook', [FinancialDonationController::class, 'handleWebhook']);

// ── ADMIN ONLY ───────────────────────────────────────────────────────────────
Route::post('/admin/staff', [AuthController::class, 'createStaff']);
Route::post('/admin/admin', [AuthController::class, 'createAdmin']);

// ── PUBLIC — Beneficiary donation request ────────────────────────────────────
Route::post('/donation-requests', [DonationController::class, 'submitRequest']);

// ── STAFF — Donation Requests (beneficiary requests) ─────────────────────────
Route::get('/staff/donation-requests',                  [DonationController::class, 'getRequests']);
Route::get('/staff/donation-requests/stats',            [DonationController::class, 'getRequestStats']);
Route::post('/staff/donation-requests/{id}/allocate',   [DonationController::class, 'allocateRequest']);
Route::post('/staff/donation-requests/{id}/unallocate', [DonationController::class, 'unallocateRequest']);
Route::post('/staff/donation-requests/{id}/decline',    [DonationController::class, 'declineRequest']);
Route::post('/staff/donation-requests/{id}/done',       [DonationController::class, 'doneRequest']);

// ── STAFF — Donation Drives ───────────────────────────────────────────────────
Route::get('/staff/donation-drives',         [DonationController::class, 'getDrives']);
Route::get('/staff/donation-drives/stats',   [DonationController::class, 'getDriveStats']);
Route::post('/staff/donation-drives',        [DonationController::class, 'createDrive']);
Route::put('/staff/donation-drives/{id}',    [DonationController::class, 'updateDrive']);
Route::delete('/staff/donation-drives/{id}', [DonationController::class, 'deleteDrive']);

// ── STAFF — Beneficiary Requests ─────────────────────────────────────────────
Route::get('/staff/beneficiary-requests',                  [DonationController::class, 'getBeneficiaryRequests']);
Route::get('/staff/beneficiary-requests/stats',            [DonationController::class, 'getBeneficiaryRequestStats']);
Route::post('/staff/beneficiary-requests/{id}/allocate',   [DonationController::class, 'allocateBeneficiaryRequest']);
Route::post('/staff/beneficiary-requests/{id}/reject',     [DonationController::class, 'rejectBeneficiaryRequest']);

// ── STAFF — Food Inventory (CRUD) ────────────────────────────────────────────
Route::get('/staff/inventory/food',         [DonationController::class, 'getInventory']);
Route::post('/staff/inventory/food',        [DonationController::class, 'storeInventory']);
Route::put('/staff/inventory/food/{id}',    [DonationController::class, 'updateInventory']);
Route::delete('/staff/inventory/food/{id}', [DonationController::class, 'destroyInventory']);

// ── STAFF — Donation Journey Tracker: From Donor ──────────────────────────────
Route::get('/staff/donations/journey/from-donor',                    [FoodDonationController::class, 'getDonorJourney']);
Route::post('/staff/donations/journey/from-donor/{id}/accept',       [FoodDonationController::class, 'acceptDonorJourney']);
Route::post('/staff/donations/journey/from-donor/{id}/received',     [FoodDonationController::class, 'receivedDonorJourney']);
Route::post('/staff/donations/journey/from-donor/{id}/decline',      [FoodDonationController::class, 'declineDonorJourney']);
Route::post('/staff/donations/journey/from-donor/{id}/cancel-transit',[FoodDonationController::class, 'cancelDonorJourney']);

// ── STAFF — Donation Journey Tracker: To Beneficiary ─────────────────────────
// Drive-level actions (use drive ID)
Route::get('/staff/donations/journey/to-beneficiary',                      [DonationController::class, 'getBeneficiaryJourney']);
Route::post('/staff/donations/journey/to-beneficiary/{id}/accept',         [DonationController::class, 'acceptDriveJourney']);
Route::post('/staff/donations/journey/to-beneficiary/{id}/decline',        [DonationController::class, 'declineDriveJourney']);

// Delivery-level actions (use delivery ID)
Route::post('/staff/donations/journey/deliveries/{id}/received',           [DonationController::class, 'receivedDriveJourney']);
Route::post('/staff/donations/journey/deliveries/{id}/cancel',             [DonationController::class, 'cancelDriveJourney']);
