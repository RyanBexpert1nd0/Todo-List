"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary"
  size?: "sm" | "md" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === "default" && "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20",
          variant === "ghost" && "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
          variant === "outline" && "border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600",
          variant === "destructive" && "bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30",
          variant === "secondary" && "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
          // Sizes
          size === "sm" && "h-8 px-3 text-xs",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          size === "icon" && "h-9 w-9",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
