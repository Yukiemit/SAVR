<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DonationController;

// ── AUTH ROUTES ──
Route::post('/register',          [AuthController::class, 'register']);
Route::post('/verify-otp',        [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp',        [AuthController::class, 'resendOtp']);
Route::post('/login',             [AuthController::class, 'login']);
Route::post('/forgot-password',   [AuthController::class, 'forgotPassword']);
Route::post('/verify-reset-otp',  [AuthController::class, 'verifyResetOtp']);
Route::post('/reset-password',    [AuthController::class, 'resetPassword']);

// ── ADMIN ONLY ──
Route::post('/admin/staff',       [AuthController::class, 'createStaff']);

// ── PUBLIC — Beneficiary submits donation request (Contact page) ──
Route::post('/donation-requests', [DonationController::class, 'submitRequest']);

// ── STAFF — Donation Requests ──
Route::get('/staff/donation-requests',                      [DonationController::class, 'getRequests']);
Route::get('/staff/donation-requests/stats',                [DonationController::class, 'getRequestStats']);
Route::post('/staff/donation-requests/{id}/allocate',       [DonationController::class, 'allocateRequest']);
Route::post('/staff/donation-requests/{id}/unallocate',     [DonationController::class, 'unallocateRequest']);
Route::post('/staff/donation-requests/{id}/decline',        [DonationController::class, 'declineRequest']);
Route::post('/staff/donation-requests/{id}/done',           [DonationController::class, 'doneRequest']);

// ── STAFF — Donation Drives ──
Route::get('/staff/donation-drives',         [DonationController::class, 'getDrives']);
Route::get('/staff/donation-drives/stats',   [DonationController::class, 'getDriveStats']);
Route::post('/staff/donation-drives',        [DonationController::class, 'createDrive']);
Route::put('/staff/donation-drives/{id}',    [DonationController::class, 'updateDrive']);
Route::delete('/staff/donation-drives/{id}', [DonationController::class, 'deleteDrive']);