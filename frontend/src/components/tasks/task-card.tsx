"use client"

import { cn } from "@/lib/utils"
import { Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants"
import { Calendar, CheckCircle2, Circle, Clock, User, MessageSquare, Pencil, Trash2 } from "lucide-react"
import { format, isPast } from "date-fns"

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.deadline_at && isPast(new Date(task.deadline_at)) && task.status !== "done"
  const isDone = task.status === "done"

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-zinc-900/50 backdrop-blur-sm p-4 transition-all duration-300",
        "hover:border-zinc-600 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-black/20",
        isDone
          ? "border-zinc-800 opacity-60"
          : isOverdue
          ? "border-rose-500/30 hover:border-rose-500/50"
          : "border-zinc-800"
      )}
    >
      {/* Category color bar */}
      {task.category && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: task.category.color }}
        />
      )}

      <div className="flex items-start gap-3 pl-2">
        {/* Toggle button */}
        <button
          id={`task-toggle-${task.id}`}
          onClick={() => onToggle(task.id)}
          className={cn(
            "mt-0.5 flex-shrink-0 transition-all duration-300",
            isDone ? "text-emerald-500" : "text-zinc-600 hover:text-violet-400"
          )}
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 animate-in fade-in duration-300" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={cn(
                "text-sm font-medium leading-tight transition-all duration-300",
                isDone ? "line-through text-zinc-500" : "text-zinc-100"
              )}
            >
              {task.title}
            </h3>
            {/* Badges */}
            <Badge
              variant="outline"
              className={cn("text-xs", PRIORITY_CONFIG[task.priority].color)}
            >
              {PRIORITY_CONFIG[task.priority].label}
            </Badge>
            {task.status === "in_progress" && (
              <Badge variant="outline" className={cn("text-xs", STATUS_CONFIG.in_progress.color)}>
                In Progress
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="outline" className="text-xs bg-rose-500/20 text-rose-400 border-rose-500/30">
                Overdue
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{task.description}</p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {task.deadline_at && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-rose-400" : "text-zinc-500"
                )}
              >
                <Clock className="h-3 w-3" />
                {format(new Date(task.deadline_at), "d MMM yyyy")}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <User className="h-3 w-3" />
                {task.assignee.name}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: task.category.color }}
                />
                {task.category.name}
              </span>
            )}
            {(task.comments?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MessageSquare className="h-3 w-3" />
                {task.comments?.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            id={`task-edit-${task.id}`}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            id={`task-delete-${task.id}`}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-rose-400"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
