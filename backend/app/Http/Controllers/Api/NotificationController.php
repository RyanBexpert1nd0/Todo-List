<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->header('X-Clerk-User-Id');

        $notifications = Notification::where('user_id', $userId)
            ->with('task')
            ->latest()
            ->paginate(20);

        return response()->json($notifications);
    }

    /**
     * PATCH /api/notifications/{id}/read
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $userId = $request->header('X-Clerk-User-Id');

        $notification = Notification::where('user_id', $userId)->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json($notification);
    }

    /**
     * POST /api/notifications/read-all
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $userId = $request->header('X-Clerk-User-Id');

        Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
