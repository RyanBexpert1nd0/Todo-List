<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    /**
     * GET /api/organizations/{org}/tasks
     * List tasks with optional filters
     */
    public function index(Request $request, string $orgId): JsonResponse
    {
        $query = Task::forOrganization($orgId)
            ->with(['creator', 'assignee', 'category'])
            ->orderBy('sort_order');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by assigned user
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Quick filters
        if ($request->has('filter')) {
            match ($request->filter) {
                'today' => $query->whereDate('deadline_at', today()),
                'this_week' => $query->whereBetween('deadline_at', [now()->startOfWeek(), now()->endOfWeek()]),
                'overdue' => $query->overdue(),
                default => null,
            };
        }

        $tasks = $query->paginate($request->get('per_page', 20));

        return response()->json($tasks);
    }

    /**
     * POST /api/organizations/{org}/tasks
     */
    public function store(Request $request, string $orgId): JsonResponse
    {
        $validated = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string',
            'priority'        => 'in:low,medium,high,urgent',
            'status'          => 'in:todo,in_progress,done',
            'deadline_at'     => 'nullable|date',
            'category_id'     => 'nullable|uuid|exists:categories,id',
            'assigned_to'     => 'nullable|uuid|exists:users,id',
            'recurrence_type' => 'in:none,daily,weekly,monthly,yearly',
            'recurrence_rule' => 'nullable|string',
        ]);

        // Get max sort_order for the org
        $maxOrder = Task::forOrganization($orgId)->max('sort_order') ?? 0;

        $task = Task::create([
            ...$validated,
            'organization_id' => $orgId,
            'created_by'      => $request->user()?->id ?? $request->header('X-Clerk-User-Id'),
            'sort_order'      => $maxOrder + 1000,
        ]);

        return response()->json($task->load(['creator', 'assignee', 'category']), 201);
    }

    /**
     * GET /api/organizations/{org}/tasks/{id}
     */
    public function show(string $orgId, string $id): JsonResponse
    {
        $task = Task::forOrganization($orgId)
            ->with(['creator', 'assignee', 'category', 'comments.user'])
            ->findOrFail($id);

        return response()->json($task);
    }

    /**
     * PUT /api/organizations/{org}/tasks/{id}
     */
    public function update(Request $request, string $orgId, string $id): JsonResponse
    {
        $task = Task::forOrganization($orgId)->findOrFail($id);

        $validated = $request->validate([
            'title'           => 'sometimes|string|max:255',
            'description'     => 'nullable|string',
            'priority'        => 'sometimes|in:low,medium,high,urgent',
            'status'          => 'sometimes|in:todo,in_progress,done',
            'deadline_at'     => 'nullable|date',
            'category_id'     => 'nullable|uuid|exists:categories,id',
            'assigned_to'     => 'nullable|uuid|exists:users,id',
            'recurrence_type' => 'sometimes|in:none,daily,weekly,monthly,yearly',
            'recurrence_rule' => 'nullable|string',
        ]);

        $task->update($validated);

        return response()->json($task->load(['creator', 'assignee', 'category']));
    }

    /**
     * DELETE /api/organizations/{org}/tasks/{id} (Soft Delete)
     */
    public function destroy(string $orgId, string $id): JsonResponse
    {
        $task = Task::forOrganization($orgId)->findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * PATCH /api/organizations/{org}/tasks/{id}/toggle
     */
    public function toggle(string $orgId, string $id): JsonResponse
    {
        $task = Task::forOrganization($orgId)->findOrFail($id);

        if ($task->status === 'done') {
            $task->update(['status' => 'todo', 'completed_at' => null]);
        } else {
            $task->update(['status' => 'done', 'completed_at' => now()]);
        }

        return response()->json($task->fresh(['creator', 'assignee', 'category']));
    }

    /**
     * PATCH /api/organizations/{org}/tasks/reorder
     */
    public function reorder(Request $request, string $orgId): JsonResponse
    {
        $validated = $request->validate([
            'tasks'            => 'required|array',
            'tasks.*.id'       => 'required|uuid',
            'tasks.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['tasks'] as $item) {
            Task::forOrganization($orgId)
                ->where('id', $item['id'])
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Tasks reordered successfully']);
    }

    /**
     * POST /api/organizations/{org}/tasks/{id}/comments
     */
    public function addComment(Request $request, string $orgId, string $id): JsonResponse
    {
        $task = Task::forOrganization($orgId)->findOrFail($id);

        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()?->id ?? $request->header('X-Clerk-User-Id'),
            'body'    => $validated['body'],
        ]);

        return response()->json($comment->load('user'), 201);
    }
}
