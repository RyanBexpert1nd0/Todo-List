<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TasksReordered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $organizationId;
    public $reorderedTasks;

    /**
     * Create a new event instance.
     */
    public function __construct(string $organizationId, array $reorderedTasks)
    {
        $this->organizationId = $organizationId;
        $this->reorderedTasks = $reorderedTasks;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('org.' . $this->organizationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'TasksReordered';
    }

    public function broadcastWith(): array
    {
        return [
            'organization_id' => $this->organizationId,
            'tasks' => $this->reorderedTasks,
        ];
    }
}