// API base URL - points to Laravel backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

export const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  medium: { label: "Medium", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  high: { label: "High", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  urgent: { label: "Urgent", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
} as const

export const STATUS_CONFIG = {
  todo: { label: "To Do", color: "bg-slate-500/20 text-slate-400" },
  in_progress: { label: "In Progress", color: "bg-violet-500/20 text-violet-400" },
  done: { label: "Done", color: "bg-emerald-500/20 text-emerald-400" },
} as const

export type Priority = keyof typeof PRIORITY_CONFIG
export type Status = keyof typeof STATUS_CONFIG
