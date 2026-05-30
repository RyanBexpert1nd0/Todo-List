"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser, useAuth, useClerk } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ListTodo,
  Tag,
  Bell,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { API_BASE_URL } from "@/lib/constants"

const FALLBACK_ORG_ID = "org_placeholder_123"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()
  const [collapsed, setCollapsed] = useState(false)

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return 0
      const data = await res.json()
      const notifications = data?.data ?? []
      return notifications.filter((n: { read_at: string | null }) => !n.read_at).length
    },
    refetchInterval: 30_000, // poll every 30s
    retry: false,
  })

  const navItems = [
    { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard, badge: 0 },
    { href: "/tasks",         label: "Tasks",         icon: ListTodo,        badge: 0 },
    { href: "/categories",    label: "Categories",    icon: Tag,             badge: 0 },
    { href: "/notifications", label: "Notifications", icon: Bell,            badge: unreadCount },
  ]

  const isDemoMode = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder")

  const handleSignOut = async () => {
    if (isDemoMode) {
      window.location.href = "/"
    } else {
      await signOut({ redirectUrl: "/" })
    }
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-zinc-950 border-r border-zinc-800/60 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-zinc-800/60",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 shadow-lg shadow-violet-500/10">
          <ListTodo className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-white tracking-tight">
            Collab<span className="text-violet-400">Todo</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2 py-4">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-0" : "",
                isActive
                  ? "bg-violet-600/15 text-violet-300"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              )}
              title={collapsed ? label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className={cn("h-5 w-5", isActive ? "text-violet-400" : "")} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              {!collapsed && <span className="flex-1">{label}</span>}
              {isActive && !collapsed && (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-zinc-800/60 p-3", collapsed ? "flex flex-col items-center gap-2" : "space-y-2")}>
        {isDemoMode ? (
          /* Demo Mode Custom Profile & Log out Button */
          <>
            {!collapsed ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-3 rounded-lg p-2 bg-zinc-900/50 border border-zinc-800/50">
                  <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-sm select-none">
                    D
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">Demo User</p>
                    <p className="text-xs text-zinc-500 truncate">demo@collabtodo.local</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span>Log out (Demo)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignOut}
                className="h-9 w-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                title="Log out (Demo)"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          /* Normal Clerk User Button & Custom Log Out Button below it */
          <div className="flex flex-col gap-2 w-full">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800/60 transition-colors">
                  <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                <button
                  onClick={handleSignOut}
                  className="h-9 w-9 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 flex items-center justify-center transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors shadow-md"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  )
}
