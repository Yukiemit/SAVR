<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\BeneficiaryController;
use App\Http\Controllers\FoodDonationController;
use App\Http\Controllers\FinancialDonationController;
use App\Http\Controllers\DonorController;

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
    Route::get('/beneficiary/profile',   [BeneficiaryController::class, 'profile']);
    Route::get('/beneficiary/dashboard', [BeneficiaryController::class, 'dashboard']);

    // ── Donor — Profile, Stats, Combined History ─────────────────────────────
    Route::get('/donor/profile',    [DonorController::class, 'profile']);
    Route::get('/donor/stats',      [DonorController::class, 'stats']);
    Route::get('/donor/donations',  [DonorController::class, 'donations']);

    // ── Donor — Food Donation (pending staff approval → inventory on approve) ─
    Route::post('/donor/donations/food', [FoodDonationController::class, 'store']);
    Route::get('/donor/donations/food',  [FoodDonationController::class, 'index']);

    // ── Donor — Financial Donation: Manual (receipt upload → staff reviews) ──
    Route::post('/donor/donations',               [FinancialDonationController::class, 'store']);
    Route::get('/donor/donations/financial',      [FinancialDonationController::class, 'index']);

    // ── Donor — Financial Donation: PayMongo (creates link → auto-approved by webhook) ──
    Route::post('/donor/donations/paymongo',      [FinancialDonationController::class, 'createPaymentLink']);

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
