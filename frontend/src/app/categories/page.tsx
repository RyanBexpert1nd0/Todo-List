"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Plus, Loader2, Trash2, Pencil } from "lucide-react"

import { Category } from "@/types"
import { API_BASE_URL } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"

const FALLBACK_ORG_ID = "org_placeholder_123"

export default function CategoriesPage() {
  const { getToken, orgId } = useAuth()
  const currentOrgId = orgId || FALLBACK_ORG_ID
  const queryClient = useQueryClient()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()

  const { register, handleSubmit, reset } = useForm<{ name: string; color: string }>()

  const fetchCategories = async (): Promise<Category[]> => {
    const token = await getToken()
    const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch categories")
    return res.json()
  }

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories", currentOrgId],
    queryFn: fetchCategories,
  })

  const saveCategory = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const token = await getToken()
      const url = editingCategory
        ? `${API_BASE_URL}/organizations/${currentOrgId}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/organizations/${currentOrgId}/categories`
      const method = editingCategory ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save category")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", currentOrgId] })
      setIsModalOpen(false)
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete category")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", currentOrgId] })
    },
  })

  const handleCreate = () => {
    setEditingCategory(undefined)
    reset({ name: "", color: "#6366f1" })
    setIsModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    reset({ name: category.name, color: category.color })
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Categories</h1>
          <p className="text-zinc-400 mt-1">Manage task categories for your organization.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full shadow-sm"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-medium text-zinc-100">{category.name}</h3>
              </div>
            </div>
            
            <div className="text-sm text-zinc-500">
              {category.tasks_count || 0} Tasks
            </div>

            <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50"
                onClick={() => deleteCategory.mutate(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => saveCategory.mutate(data))} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Name</label>
              <Input {...register("name", { required: true })} placeholder="e.g. Frontend" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Color</label>
              <div className="flex gap-4">
                <Input type="color" {...register("color", { required: true })} className="w-16 h-10 p-1" />
                <Input type="text" {...register("color", { required: true })} className="flex-1" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCategory ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
