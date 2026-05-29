"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Task } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { PRIORITY_CONFIG } from "@/lib/constants"
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
  category_id?: string
  deadline_at?: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task // If provided, we are editing. Otherwise, creating.
  onSubmit: (data: TaskFormValues) => void
  categories?: { id: string; name: string }[]
}

export function TaskModal({ isOpen, onClose, task, onSubmit, categories = [] }: TaskModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  })

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        category_id: task.category_id || "",
        deadline_at: task.deadline_at ? task.deadline_at.substring(0, 16) : "", // Format for datetime-local
      })
    } else {
      reset({
        title: "",
        description: "",
        priority: "medium",
        category_id: "",
        deadline_at: "",
      })
    }
  }, [task, reset, isOpen])

  const handleFormSubmit = (data: TaskFormValues) => {
    onSubmit(data)
    onClose()
  }

  const priorityOptions = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Title</label>
            <Input {...register("title", { required: true })} placeholder="Task title..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <Textarea {...register("description")} placeholder="Add details..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Priority</label>
              <Select {...register("priority")} options={priorityOptions} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Category</label>
              <Select
                {...register("category_id")}
                options={categoryOptions}
                placeholder="No Category"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Deadline</label>
            <Input type="datetime-local" {...register("deadline_at")} />
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
