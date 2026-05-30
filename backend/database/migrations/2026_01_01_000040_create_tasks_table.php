<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('organization_id');
            $table->uuid('created_by');
            $table->uuid('assigned_to')->nullable();
            $table->uuid('parent_task_id')->nullable(); // for recurring tasks
            $table->uuid('category_id')->nullable();

            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['todo', 'in_progress', 'done'])->default('todo');
            $table->timestamp('deadline_at')->nullable();
            $table->integer('sort_order')->default(0);

            // Recurring task config
            $table->enum('recurrence_type', ['none', 'daily', 'weekly', 'monthly', 'yearly'])->default('none');
            $table->string('recurrence_rule')->nullable(); // cron expression

            $table->timestamp('completed_at')->nullable();
            $table->softDeletes(); // adds deleted_at
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('parent_task_id')->references('id')->on('tasks')->onDelete('set null');

            // Indexes for performance
            $table->index(['organization_id', 'status']);
            $table->index(['deadline_at', 'completed_at', 'deleted_at']);
            $table->index(['organization_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
