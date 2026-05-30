"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth, useUser } from "@clerk/nextjs"
import { Loader2, CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Calendar } from "lucide-react"
import { API_BASE_URL, PRIORITY_CONFIG } from "@/lib/constants"
import { DashboardStats, WeeklyProgress, Task } from "@/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const FALLBACK_ORG_ID = "org_placeholder_123"

interface DashboardData {
  stats: DashboardStats
  weekly_progress: WeeklyProgress[]
  upcoming_deadlines: Task[]
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <div className={cn("relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700")}>
    <div className={cn("absolute inset-0 opacity-5", color)} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      </div>
      <div className={cn("rounded-xl p-2.5", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  const { getToken, orgId } = useAuth()
  const { user } = useUser()
  const currentOrgId = orgId || FALLBACK_ORG_ID

  // Client-only greeting to avoid hydration mismatch
  const [greeting, setGreeting] = useState("morning")
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? "morning" : h < 17 ? "afternoon" : "evening")
  }, [])

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard", currentOrgId],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/organizations/${currentOrgId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch dashboard")
      return res.json()
    },
    // Use placeholder data if API fails
    placeholderData: {
      stats: { total_tasks: 0, completed_tasks: 0, overdue_tasks: 0, my_tasks: 0, completion_rate: 0 },
      weekly_progress: [],
      upcoming_deadlines: [],
    },
  })

  const stats = data?.stats
  const weeklyData = data?.weekly_progress ?? []
  const maxCompleted = Math.max(...weeklyData.map((w) => w.completed), 1)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Good {greeting},{" "}
          <span className="text-violet-400">{user?.firstName ?? "there"}</span> 👋
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">Here's what's happening with your team today.</p>
      </div>

      {/* API Error Notice */}
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400 text-sm">
          ⚠️ Dashboard data unavailable — backend API is not connected yet.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ListTodo} label="Total Tasks" value={stats?.total_tasks ?? 0} color="bg-violet-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats?.completed_tasks ?? 0} color="bg-emerald-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue_tasks ?? 0} color="bg-rose-600" />
        <StatCard icon={Clock} label="My Tasks" value={stats?.my_tasks ?? 0} color="bg-blue-600" />
      </div>

      {/* Completion Rate + Weekly Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Rate Ring */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">Completion Rate</h2>
          <div className="flex items-center gap-8">
            <div className="relative flex-shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#27272a" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="#7c3aed" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (stats?.completion_rate ?? 0) / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats?.completion_rate ?? 0}%</span>
                <span className="text-xs text-zinc-500">Done</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Completed</span>
                <span className="font-semibold text-emerald-400">{stats?.completed_tasks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Remaining</span>
                <span className="font-semibold text-zinc-300">{(stats?.total_tasks ?? 0) - (stats?.completed_tasks ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Overdue</span>
                <span className="font-semibold text-rose-400">{stats?.overdue_tasks ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">Weekly Activity</h2>
          {weeklyData.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-zinc-600 text-sm">No data yet</p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyData.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  <div className="relative w-full flex items-end justify-center" style={{ height: "88px" }}>
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-violet-600/30 transition-all duration-500"
                      style={{ height: `${(day.created / maxCompleted) * 80}px` }}
                    />
                    <div
                      className="absolute bottom-0 w-full max-w-[28px] rounded-t-md bg-violet-500 transition-all duration-700"
                      style={{ height: `${(day.completed / maxCompleted) * 80}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600">{format(new Date(day.date), "EEE")}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="h-2 w-2 rounded-sm bg-violet-500" /> Completed</span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="h-2 w-2 rounded-sm bg-violet-600/30" /> Created</span>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Upcoming Deadlines</h2>
        </div>
        {(data?.upcoming_deadlines ?? []).length === 0 ? (
          <p className="text-zinc-600 text-sm py-4 text-center">No upcoming deadlines in the next 7 days 🎉</p>
        ) : (
          <div className="space-y-2">
            {data?.upcoming_deadlines.map((task) => (
              <div key={task.id} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                {task.category && (
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: task.category.color }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{task.title}</p>
                  {task.assignee && <p className="text-xs text-zinc-500">{task.assignee.name}</p>}
                </div>
                <span className="text-xs text-amber-400 font-medium flex-shrink-0">
                  {task.deadline_at ? format(new Date(task.deadline_at), "d MMM") : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
