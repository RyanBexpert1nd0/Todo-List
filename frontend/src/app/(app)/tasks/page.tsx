"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Plus, Loader2 } from "lucide-react"

import { Task, Category } from "@/types"
import { API_BASE_URL } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskModal } from "@/components/tasks/task-modal"
import { useEcho } from "@/lib/use-echo"

const FALLBACK_ORG_ID = "org_placeholder_123"

export default function TasksPage() {
  const { getToken, orgId } = useAuth()
  const currentOrgId = orgId || FALLBACK_ORG_ID
  const queryClient = useQueryClient()
  const echo = useEcho()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  useEffect(() => {
    if (!echo) return
    const channel = echo.private(`org.${currentOrgId}`)
    channel.listen(".TaskCreated", () => { queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }) })
    channel.listen(".TaskUpdated", () => { queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }) })
    channel.listen(".TaskDeleted", () => { queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }) })
    return () => {
      channel.stopListening(".TaskCreated")
      channel.stopListening(".TaskUpdated")
      channel.stopListening(".TaskDeleted")
    }
  }, [echo, currentOrgId, queryClient])

  const fetchTasks = async (): Promise<Task[]> => {
    const token = await getToken()
    const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
    if (!res.ok) throw new Error("Failed to fetch tasks")
    const data = await res.json()
    return data.data
  }

  const { data: tasks, isLoading, error } = useQuery({ queryKey: ["tasks", currentOrgId], queryFn: fetchTasks })

  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/${taskId}/toggle`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/${taskId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }),
  })

  const saveTask = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken()
      const url = editingTask
        ? `${API_BASE_URL}/organizations/${currentOrgId}/tasks/${editingTask.id}`
        : `${API_BASE_URL}/organizations/${currentOrgId}/tasks`
      const res = await fetch(url, {
        method: editingTask ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save task")
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }),
  })

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  )

  const todoTasks = tasks?.filter((t) => t.status !== "done") || []
  const doneTasks = tasks?.filter((t) => t.status === "done") || []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tasks</h1>
          <p className="text-zinc-400 mt-1 text-sm">Manage your team's tasks and priorities.</p>
        </div>
        <Button id="btn-create-task" onClick={() => { setEditingTask(undefined); setIsModalOpen(true) }}>
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm">
          Could not connect to the API. Make sure the backend is running.
        </div>
      )}

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">Active ({todoTasks.length})</h2>
          {todoTasks.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
              <p className="text-zinc-500 text-sm">No active tasks. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {todoTasks.map((task) => (
                <TaskCard key={task.id} task={task}
                  onToggle={(id) => toggleTask.mutate(id)}
                  onEdit={(t) => { setEditingTask(t); setIsModalOpen(true) }}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          )}
        </section>

        {doneTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-600 mb-3">Completed ({doneTasks.length})</h2>
            <div className="grid gap-2.5 opacity-50 hover:opacity-80 transition-opacity">
              {doneTasks.map((task) => (
                <TaskCard key={task.id} task={task}
                  onToggle={(id) => toggleTask.mutate(id)}
                  onEdit={(t) => { setEditingTask(t); setIsModalOpen(true) }}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        task={editingTask} onSubmit={(data) => saveTask.mutate(data)} />
    </div>
  )
}
