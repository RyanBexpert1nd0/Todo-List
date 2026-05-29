<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * GET /api/organizations/{org}/dashboard
     */
    public function index(Request $request, string $orgId): JsonResponse
    {
        $userId = $request->header('X-Clerk-User-Id');

        $totalTasks = Task::forOrganization($orgId)->count();
        $completedTasks = Task::forOrganization($orgId)->where('status', 'done')->count();
        $overdueTasks = Task::forOrganization($orgId)->overdue()->count();
        $myTasks = Task::forOrganization($orgId)
            ->where(fn($q) => $q->where('created_by', $userId)->orWhere('assigned_to', $userId))
            ->where('status', '!=', 'done')
            ->count();

        // Weekly progress - last 7 days
        $weeklyProgress = collect(range(6, 0))->map(function ($daysAgo) use ($orgId) {
            $date = now()->subDays($daysAgo)->toDateString();
            return [
                'date' => $date,
                'completed' => Task::forOrganization($orgId)
                    ->whereDate('completed_at', $date)
                    ->count(),
                'created' => Task::forOrganization($orgId)
                    ->whereDate('created_at', $date)
                    ->count(),
            ];
        })->values();

        // Upcoming deadlines (next 7 days)
        $upcomingDeadlines = Task::forOrganization($orgId)
            ->whereNotNull('deadline_at')
            ->where('deadline_at', '>=', now())
            ->where('deadline_at', '<=', now()->addDays(7))
            ->where('status', '!=', 'done')
            ->with(['assignee', 'category'])
            ->orderBy('deadline_at')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_tasks'     => $totalTasks,
                'completed_tasks' => $completedTasks,
                'overdue_tasks'   => $overdueTasks,
                'my_tasks'        => $myTasks,
                'completion_rate' => $totalTasks > 0
                    ? round(($completedTasks / $totalTasks) * 100, 1)
                    : 0,
            ],
            'weekly_progress'   => $weeklyProgress,
            'upcoming_deadlines' => $upcomingDeadlines,
        ]);
    }
}
