<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with demo data.
     */
    public function run(): void
    {
        // Create demo organization
        $org = Organization::create([
            'clerk_org_id' => 'org_placeholder_123',
            'name'         => 'Demo Team',
            'slug'         => 'demo-team',
        ]);

        // Create demo users
        $alice = User::create([
            'clerk_id'   => 'user_demo_alice',
            'name'       => 'Alice Johnson',
            'email'      => 'alice@demo.com',
            'avatar_url' => null,
        ]);

        $bob = User::create([
            'clerk_id'   => 'user_demo_bob',
            'name'       => 'Bob Smith',
            'email'      => 'bob@demo.com',
            'avatar_url' => null,
        ]);

        // Add memberships
        Membership::create(['user_id' => $alice->id, 'organization_id' => $org->id, 'role' => 'admin']);
        Membership::create(['user_id' => $bob->id,   'organization_id' => $org->id, 'role' => 'member']);

        // Create categories
        $frontend  = Category::create(['organization_id' => $org->id, 'name' => 'Frontend',  'color' => '#6366f1']);
        $backend   = Category::create(['organization_id' => $org->id, 'name' => 'Backend',   'color' => '#10b981']);
        $design    = Category::create(['organization_id' => $org->id, 'name' => 'Design',    'color' => '#f59e0b']);
        $devops    = Category::create(['organization_id' => $org->id, 'name' => 'DevOps',    'color' => '#ef4444']);

        // Create sample tasks
        $tasks = [
            ['title' => 'Set up Next.js project structure',   'priority' => 'high',   'status' => 'done',        'category_id' => $frontend->id,  'created_by' => $alice->id, 'assigned_to' => $alice->id],
            ['title' => 'Design dashboard UI mockups',        'priority' => 'medium', 'status' => 'done',        'category_id' => $design->id,    'created_by' => $alice->id, 'assigned_to' => $bob->id],
            ['title' => 'Implement Clerk authentication',     'priority' => 'urgent', 'status' => 'done',        'category_id' => $backend->id,   'created_by' => $alice->id, 'assigned_to' => $alice->id],
            ['title' => 'Build task CRUD API endpoints',      'priority' => 'high',   'status' => 'in_progress', 'category_id' => $backend->id,   'created_by' => $alice->id, 'assigned_to' => $alice->id, 'deadline_at' => now()->addDays(2)],
            ['title' => 'Add drag-and-drop task reordering',  'priority' => 'medium', 'status' => 'todo',        'category_id' => $frontend->id,  'created_by' => $bob->id,   'assigned_to' => $bob->id,   'deadline_at' => now()->addDays(5)],
            ['title' => 'Configure Laravel Reverb WebSocket', 'priority' => 'high',   'status' => 'todo',        'category_id' => $devops->id,    'created_by' => $alice->id, 'assigned_to' => $alice->id, 'deadline_at' => now()->addDays(3)],
            ['title' => 'Write API documentation',            'priority' => 'low',    'status' => 'todo',        'category_id' => $backend->id,   'created_by' => $bob->id,   'assigned_to' => $bob->id],
            ['title' => 'Set up CI/CD pipeline',              'priority' => 'medium', 'status' => 'todo',        'category_id' => $devops->id,    'created_by' => $alice->id, 'assigned_to' => null,       'deadline_at' => now()->addDays(7)],
            ['title' => 'Implement notification system',      'priority' => 'medium', 'status' => 'in_progress', 'category_id' => $backend->id,   'created_by' => $alice->id, 'assigned_to' => $alice->id, 'deadline_at' => now()->addDays(4)],
            ['title' => 'Mobile responsive design review',    'priority' => 'low',    'status' => 'todo',        'category_id' => $design->id,    'created_by' => $bob->id,   'assigned_to' => $bob->id],
        ];

        foreach ($tasks as $i => $taskData) {
            $completedAt = $taskData['status'] === 'done' ? now()->subDays(rand(1, 5)) : null;
            Task::create([
                ...$taskData,
                'organization_id' => $org->id,
                'sort_order'      => ($i + 1) * 1000,
                'completed_at'    => $completedAt,
                'recurrence_type' => 'none',
            ]);
        }
    }
}
