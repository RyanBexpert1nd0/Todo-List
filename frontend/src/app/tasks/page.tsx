"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Plus, Loader2 } from "lucide-react"

import { Task, Category } from "@/types"
import { API_BASE_URL } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskModal } from "@/components/tasks/task-modal"

// Temporary hardcoded org ID until Clerk Org is fully set up
const FALLBACK_ORG_ID = "org_placeholder_123"

export default function TasksPage() {
  const { getToken, orgId } = useAuth()
  const currentOrgId = orgId || FALLBACK_ORG_ID
  const queryClient = useQueryClient()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const fetchTasks = async (): Promise<Task[]> => {
    const token = await getToken()
    const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!res.ok) throw new Error("Failed to fetch tasks")
    const data = await res.json()
    return data.data // Assuming paginated response
  }

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", currentOrgId],
    queryFn: fetchTasks,
  })

  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to toggle task")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] })
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete task")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] })
    },
  })

  const saveTask = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken()
      const url = editingTask
        ? `${API_BASE_URL}/organizations/${currentOrgId}/tasks/${editingTask.id}`
        : `${API_BASE_URL}/organizations/${currentOrgId}/tasks`
      const method = editingTask ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save task")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] })
    },
  })

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <p className="text-rose-400">Error loading tasks: {(error as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}>
          Retry
        </Button>
      </div>
    )
  }

  const todoTasks = tasks?.filter((t) => t.status !== "done") || []
  const doneTasks = tasks?.filter((t) => t.status === "done") || []

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
          <p className="text-zinc-400 mt-1">Manage your team's tasks and priorities.</p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">Active Tasks</h2>
          {todoTasks.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50">
              <p className="text-zinc-500">No active tasks found.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={(id) => toggleTask.mutate(id)}
                  onEdit={handleEditTask}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          )}
        </section>

        {doneTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-zinc-500">Completed</h2>
            <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={(id) => toggleTask.mutate(id)}
                  onEdit={handleEditTask}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        onSubmit={(data) => saveTask.mutate(data)}
      />
    </div>
  )
}
