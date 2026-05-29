"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Plus, Loader2, Trash2, Pencil, Tag } from "lucide-react"
import { Category } from "@/types"
import { API_BASE_URL } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useForm } from "react-hook-form"

const FALLBACK_ORG_ID = "org_placeholder_123"

export default function CategoriesPage() {
  const { getToken, orgId } = useAuth()
  const currentOrgId = orgId || FALLBACK_ORG_ID
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()
  const { register, handleSubmit, reset } = useForm<{ name: string; color: string }>()

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", currentOrgId],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json() as Promise<Category[]>
    },
  })

  const saveCategory = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const token = await getToken()
      const url = editingCategory
        ? `${API_BASE_URL}/organizations/${currentOrgId}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/organizations/${currentOrgId}/categories`
      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save category")
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories", currentOrgId] }); setIsModalOpen(false) },
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/categories/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories", currentOrgId] }),
  })

  const handleCreate = () => { setEditingCategory(undefined); reset({ name: "", color: "#6366f1" }); setIsModalOpen(true) }
  const handleEdit = (c: Category) => { setEditingCategory(c); reset({ name: c.name, color: c.color }); setIsModalOpen(true) }

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Categories</h1>
          <p className="text-zinc-400 mt-1 text-sm">Organize tasks into color-coded categories.</p>
        </div>
        <Button id="btn-create-category" onClick={handleCreate}>
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      {categories?.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <Tag className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No categories yet. Create your first one!</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {categories?.map((category) => (
          <div key={category.id} className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-4 w-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-zinc-900" style={{ backgroundColor: category.color, ringColor: category.color }} />
              <h3 className="font-semibold text-zinc-100 truncate">{category.name}</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2.5 py-1">
                {category.tasks_count ?? 0} tasks
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(category)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-rose-400" onClick={() => deleteCategory.mutate(category.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((data) => saveCategory.mutate(data))} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Name</label>
              <Input {...register("name", { required: true })} placeholder="e.g. Frontend" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Color</label>
              <div className="flex gap-3">
                <Input type="color" {...register("color", { required: true })} className="w-14 h-10 cursor-pointer p-1" />
                <Input type="text" {...register("color")} className="flex-1 font-mono text-sm" placeholder="#6366f1" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingCategory ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
