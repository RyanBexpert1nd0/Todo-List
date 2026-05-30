"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Plus, Loader2, Search, SlidersHorizontal, X } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { Task, Category } from "@/types"
import { API_BASE_URL, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskModal } from "@/components/tasks/task-modal"
import { useEcho } from "@/lib/use-echo"
import { cn } from "@/lib/utils"

const FALLBACK_ORG_ID = "org_placeholder_123"

// ─── Sortable wrapper for TaskCard ───────────────────────────────────────────

function SortableTaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 group/sortable">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 transition-colors opacity-0 group-hover/sortable:opacity-100 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <TaskCard task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

// ─── Filter types ─────────────────────────────────────────────────────────────

interface Filters {
  search: string
  status: string
  priority: string
  category_id: string
  quick: string
}

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  priority: "",
  category_id: "",
  quick: "",
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { getToken, orgId } = useAuth()
  const currentOrgId = orgId || FALLBACK_ORG_ID
  const queryClient = useQueryClient()
  const echo = useEcho()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  // Local ordered list for optimistic DnD
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([])

  // ─── Real-time ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!echo) return
    const channel = echo.private(`org.${currentOrgId}`)
    channel.listen(".TaskCreated", () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }))
    channel.listen(".TaskUpdated", () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }))
    channel.listen(".TaskDeleted", () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }))
    return () => {
      channel.stopListening(".TaskCreated")
      channel.stopListening(".TaskUpdated")
      channel.stopListening(".TaskDeleted")
    }
  }, [echo, currentOrgId, queryClient])

  // ─── Fetch tasks ────────────────────────────────────────────────────────────
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", currentOrgId],
    queryFn: async (): Promise<Task[]> => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks?per_page=100`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data = await res.json()
      return data.data
    },
  })

  // Sync ordered list when server data changes
  useEffect(() => {
    if (tasks) setOrderedTasks(tasks)
  }, [tasks])

  // Fetch categories for task modal and filters
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", currentOrgId],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
  })

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
      // Clean empty strings to null for nullable fields
      const payload = {
        ...data,
        category_id: data.category_id || undefined,
        deadline_at: data.deadline_at || undefined,
        description: data.description || undefined,
      }
      const res = await fetch(url, {
        method: editingTask ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save task")
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", currentOrgId] }),
  })

  const reorderTasks = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/tasks/reorder`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: items }),
      })
    },
  })

  // ─── DnD ────────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setOrderedTasks((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id)
        const newIndex = prev.findIndex((t) => t.id === over.id)
        const reordered = arrayMove(prev, oldIndex, newIndex)

        // Persist new order to backend
        reorderTasks.mutate(
          reordered.map((t, i) => ({ id: t.id, sort_order: (i + 1) * 1000 }))
        )

        return reordered
      })
    },
    [reorderTasks]
  )

  // ─── Client-side filtering ──────────────────────────────────────────────────
  const filteredTasks = orderedTasks.filter((task) => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.category_id && task.category_id !== filters.category_id) return false
    if (filters.quick === "overdue") {
      const isOverdue = task.deadline_at && new Date(task.deadline_at) < new Date() && task.status !== "done"
      if (!isOverdue) return false
    }
    if (filters.quick === "today") {
      const today = new Date().toDateString()
      if (!task.deadline_at || new Date(task.deadline_at).toDateString() !== today) return false
    }
    return true
  })

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  const todoTasks = filteredTasks.filter((t) => t.status !== "done")
  const doneTasks = filteredTasks.filter((t) => t.status === "done")

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tasks</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            {orderedTasks.length} total · {todoTasks.length} active
          </p>
        </div>
        <Button
          id="btn-create-task"
          onClick={() => { setEditingTask(undefined); setIsModalOpen(true) }}
        >
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Search + Filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(activeFiltersCount > 0 && "border-violet-500/50 text-violet-400")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Priority</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* Category */}
            {categories.length > 0 && (
              <select
                value={filters.category_id}
                onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}
                className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Quick filters */}
            <div className="flex gap-1">
              {[
                { value: "today", label: "Due Today" },
                { value: "overdue", label: "Overdue" },
              ].map((q) => (
                <button
                  key={q.value}
                  onClick={() => setFilters((f) => ({ ...f, quick: f.quick === q.value ? "" : q.value }))}
                  className={cn(
                    "h-8 rounded-lg border px-3 text-xs font-medium transition-colors",
                    filters.quick === q.value
                      ? "border-violet-500/50 bg-violet-600/20 text-violet-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Clear all */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="h-8 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-auto"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm">
          Could not connect to the API. Make sure the backend is running on{" "}
          <code className="font-mono text-rose-300">http://localhost:8000</code>.
        </div>
      )}

      {/* Task lists */}
      <div className="space-y-6">
        {/* Active tasks with DnD */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Active ({todoTasks.length})
          </h2>
          {todoTasks.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
              <p className="text-zinc-500 text-sm">
                {activeFiltersCount > 0
                  ? "No tasks match your filters."
                  : "No active tasks. Create one to get started!"}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={todoTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-2">
                  {todoTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onToggle={(id) => toggleTask.mutate(id)}
                      onEdit={(t) => { setEditingTask(t); setIsModalOpen(true) }}
                      onDelete={(id) => deleteTask.mutate(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        {/* Completed tasks */}
        {doneTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-600 mb-3">
              Completed ({doneTasks.length})
            </h2>
            <div className="grid gap-2 opacity-50 hover:opacity-80 transition-opacity">
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={(id) => toggleTask.mutate(id)}
                  onEdit={(t) => { setEditingTask(t); setIsModalOpen(true) }}
                  onDelete={(id) => deleteTask.mutate(id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Task modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        onSubmit={(data) => saveTask.mutate(data)}
        categories={categories}
      />
    </div>
  )
}
