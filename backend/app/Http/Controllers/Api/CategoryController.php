<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * GET /api/organizations/{org}/categories
     */
    public function index(string $orgId): JsonResponse
    {
        $categories = Category::where('organization_id', $orgId)
            ->withCount('tasks')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * POST /api/organizations/{org}/categories
     */
    public function store(Request $request, string $orgId): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $category = Category::create([
            ...$validated,
            'organization_id' => $orgId,
        ]);

        return response()->json($category, 201);
    }

    /**
     * PUT /api/organizations/{org}/categories/{id}
     */
    public function update(Request $request, string $orgId, string $id): JsonResponse
    {
        $category = Category::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'color' => 'sometimes|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * DELETE /api/organizations/{org}/categories/{id}
     */
    public function destroy(string $orgId, string $id): JsonResponse
    {
        $category = Category::where('organization_id', $orgId)->findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
