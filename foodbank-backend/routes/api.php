<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// ✅ REGISTER
Route::post('/register', [AuthController::class, 'register']);

// ✅ LOGIN
Route::post('/login', [AuthController::class, 'login']);

// (optional test route)
Route::get('/test', function () {
    return response()->json([
        'message' => 'API working'
    ]);
});