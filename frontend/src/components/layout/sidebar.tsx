"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ListTodo,
  Tag,
  Bell,
  Settings,
  ChevronLeft,
  Menu,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/notifications", label: "Notifications", icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-zinc-950 border-r border-zinc-800/60 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-zinc-800/60", collapsed && "justify-center px-0")}>
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
        {navItems.map(({ href, label, icon: Icon }) => {
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
              <Icon className={cn("flex-shrink-0", isActive ? "text-violet-400" : "", "h-5 w-5")} />
              {!collapsed && <span>{label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-zinc-800/60 p-3", collapsed ? "flex justify-center" : "")}>
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800/60 transition-colors">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        ) : (
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors shadow-md"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
      </button>
    </aside>
  )
}
