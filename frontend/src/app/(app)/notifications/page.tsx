"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { Bell, BellOff, Check, CheckCheck, Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"
import { Notification } from "@/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function NotificationsPage() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    placeholderData: { data: [] },
  })

  const notifications: Notification[] = data?.data ?? []

  const markAllRead = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const typeIcon = (type: string) => {
    if (type === "deadline_reminder") return "⏰"
    if (type === "assigned") return "👤"
    return "💬"
  }

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>
          <p className="text-zinc-400 mt-1 text-sm">{unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellOff className="h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-zinc-500">No notifications yet</p>
          <p className="text-zinc-600 text-sm mt-1">You'll see task updates and deadlines here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 transition-all cursor-pointer",
                notif.read_at
                  ? "border-zinc-800 bg-zinc-900/30 opacity-60"
                  : "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40"
              )}
              onClick={() => !notif.read_at && markRead.mutate(notif.id)}
            >
              <span className="text-xl mt-0.5 flex-shrink-0">{typeIcon(notif.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", notif.read_at ? "text-zinc-400" : "text-zinc-200")}>{notif.body}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notif.read_at && <div className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
