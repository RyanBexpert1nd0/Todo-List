<?php

use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'timestamp' => now()]));

Route::middleware('clerk.auth')->group(function () {
    // Organization-scoped routes
    Route::prefix('organizations/{org}')->group(function () {
        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Tasks
        Route::get('tasks', [TaskController::class, 'index']);
        Route::post('tasks', [TaskController::class, 'store']);
        Route::patch('tasks/reorder', [TaskController::class, 'reorder']);
        Route::get('tasks/{id}', [TaskController::class, 'show']);
        Route::put('tasks/{id}', [TaskController::class, 'update']);
        Route::delete('tasks/{id}', [TaskController::class, 'destroy']);
        Route::patch('tasks/{id}/toggle', [TaskController::class, 'toggle']);
        Route::post('tasks/{id}/comments', [TaskController::class, 'addComment']);

        // Categories
        Route::get('categories', [CategoryController::class, 'index']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{id}', [CategoryController::class, 'update']);
        Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
    });

    // Notifications (user-scoped)
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
});
