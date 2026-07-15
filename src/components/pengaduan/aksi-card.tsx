"use client"

import { useState } from "react"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"

type Variant = "default" | "warning" | "danger"

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
}

const TITLE_COLORS: Record<Variant, string> = {
  default: "text-blue-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
}

export default function AksiCard({
  title,
  variant = "default",
  toggleable = false,
  defaultOpen = true,
  loading = false,
  action,
  children,
  headerExtra,
  headerRight,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const showBody = !toggleable || open

  return (
    <div className={`rounded-lg border p-2 ${VARIANT_STYLES[variant]}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className={`text-sm font-semibold ${TITLE_COLORS[variant]} truncate`}>{title}</h3>
          {headerExtra && <div className="shrink-0">{headerExtra}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight && <div className="shrink-0">{headerRight}</div>}
          {action && showBody && (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled || loading}
              className={`text-xs px-2 py-1 rounded border ${
                variant === "danger"
                  ? "border-red-700 text-red-400 hover:bg-red-900/20"
                  : variant === "warning"
                  ? "border-yellow-700 text-yellow-400 hover:bg-yellow-900/20"
                  : "border-blue-700 text-blue-400 hover:bg-blue-900/20"
              } disabled:opacity-40`}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : action.label}
            </button>
          )}
          {toggleable && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? "Tutup" : "Buka"}
              className="text-gray-400 hover:text-white p-0.5"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {showBody && <div className="mt-2">{children}</div>}
    </div>
  )
}
