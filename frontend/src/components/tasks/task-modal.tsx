"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Task, Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TaskFormValues {
  title: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in_progress" | "done"
  category_id?: string
  deadline_at?: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
  onSubmit: (data: TaskFormValues) => void
  categories?: Category[]
}

export function TaskModal({ isOpen, onClose, task, onSubmit, categories = [] }: TaskModalProps) {
  const { register, handleSubmit, reset } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
    },
  })

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        category_id: task.category_id || "",
        deadline_at: task.deadline_at ? task.deadline_at.substring(0, 16) : "",
      })
    } else {
      reset({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        category_id: "",
        deadline_at: "",
      })
    }
  }, [task, reset, isOpen])

  const handleFormSubmit = (data: TaskFormValues) => {
    // Strip empty strings to avoid sending blank values
    const cleaned = {
      ...data,
      category_id: data.category_id || undefined,
      deadline_at: data.deadline_at || undefined,
      description: data.description || undefined,
    }
    onSubmit(cleaned)
    onClose()
  }

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
  }))

  const statusOptions = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
  }))

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Title <span className="text-rose-400">*</span>
            </label>
            <Input
              {...register("title", { required: true })}
              placeholder="Task title..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <Textarea {...register("description")} placeholder="Add details..." rows={3} />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Priority</label>
              <Select {...register("priority")} options={priorityOptions} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Status</label>
              <Select {...register("status")} options={statusOptions} />
            </div>
          </div>

          {/* Category + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Category</label>
              <Select
                {...register("category_id")}
                options={categoryOptions}
                placeholder="No Category"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Deadline</label>
              <Input type="datetime-local" {...register("deadline_at")} />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{task ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
