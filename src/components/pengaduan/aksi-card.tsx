"use client"

import { useState } from "react"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"

type Variant = "default" | "warning" | "danger" | "dark"

interface Props {
  title: string
  variant?: Variant
  toggleable?: boolean
  defaultOpen?: boolean
  loading?: boolean
  action?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  children: React.ReactNode
  headerExtra?: React.ReactNode
  headerRight?: React.ReactNode
}

const VARIANT_STYLES: Record<Variant, string> = {
  default: "bg-[#0F172A] border-blue-500/50",
  warning: "bg-yellow-900/20 border-yellow-700/50",
  danger: "bg-red-900/10 border-red-700/30",
  dark: "bg-[#0F172A] border-gray-500/50",
}

const TITLE_COLORS: Record<Variant, string> = {
  default: "text-blue-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
  dark: "text-gray-300",
}

export default function AksiCard({
  title,
  variant = "default",
  toggleable = true,
  defaultOpen = true,
  loading = false,
  action,
  children,
  headerExtra,
  headerRight,
}: Props) {
  const storageKey = `card-open-${title}`
  const [open, setOpen] = useState(() => {
    if (!toggleable) return true
    if (typeof window === "undefined") return defaultOpen
    const saved = sessionStorage.getItem(storageKey)
    return saved !== null ? saved === "1" : defaultOpen
  })
  const showBody = !toggleable || open

  function toggle() {
    setOpen(prev => {
      const next = !prev
      sessionStorage.setItem(storageKey, next ? "1" : "0")
      return next
    })
  }

  return (
    <div className={`rounded-xl border shadow-md ${VARIANT_STYLES[variant]}`}>
      <div className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b ${
        variant === "default" ? "bg-gradient-to-r from-blue-900/30 via-[#0F172A]/50 to-transparent border-blue-500/20" :
        variant === "warning" ? "bg-gradient-to-r from-yellow-900/30 via-yellow-900/10 to-transparent border-yellow-700/20" :
        variant === "dark" ? "bg-gradient-to-r from-gray-900/30 via-[#0F172A]/50 to-transparent border-gray-500/20" :
        "bg-gradient-to-r from-red-900/30 via-red-900/10 to-transparent border-red-700/20"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-1 h-3.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
            variant === "default" ? "bg-blue-400 shadow-blue-400/50" :
            variant === "warning" ? "bg-yellow-400 shadow-yellow-400/50" :
            variant === "dark" ? "bg-gray-400 shadow-gray-400/50" :
            "bg-red-400 shadow-red-400/50"
          }`} />
          <h3 className={`text-sm font-semibold tracking-wide ${TITLE_COLORS[variant]} truncate`}>{title}</h3>
          {headerExtra && <div className="shrink-0">{headerExtra}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight && <div className="shrink-0">{headerRight}</div>}
          {action && showBody && (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled || loading}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                variant === "danger"
                  ? "border-red-700/50 text-red-400 hover:bg-red-900/40 hover:border-red-600"
                  : variant === "warning"
                  ? "border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/40 hover:border-yellow-600"
                  : variant === "dark"
                  ? "border-gray-700/50 text-gray-400 hover:bg-gray-900/40 hover:border-gray-600"
                  : "border-blue-700/50 text-blue-400 hover:bg-blue-900/40 hover:border-blue-600"
              } disabled:opacity-40 disabled:hover:bg-transparent`}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : action.label}
            </button>
          )}
          {toggleable && (
            <button
              type="button"
              onClick={toggle}
              aria-label={open ? "Tutup" : "Buka"}
              className={`p-1 rounded-md transition-colors ${
                variant === "default" ? "text-blue-400 hover:bg-blue-900/30" :
                variant === "warning" ? "text-yellow-400 hover:bg-yellow-900/30" :
                variant === "dark" ? "text-gray-400 hover:bg-gray-900/30" :
                "text-red-400 hover:bg-red-900/30"
              }`}
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {showBody && <div className="p-3 pt-2.5">{children}</div>}
    </div>
  )
}
