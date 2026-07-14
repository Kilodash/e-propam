"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Props {
  text: string | null | undefined
  maxLines?: number
  className?: string
}

export default function ExpandableText({ text, maxLines = 5, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <span className="text-gray-400">-</span>

  // Hitung estimasi baris (line break + word wrap 80 char)
  const lines = text.split(/\n/)
  let totalVisualLines = 0
  for (const line of lines) {
    totalVisualLines += Math.max(1, Math.ceil(line.length / 80))
  }
  const isLong = totalVisualLines > maxLines

  const collapsedStyle = {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  }

  return (
    <div className={className}>
      <p
        className="whitespace-pre-wrap break-words leading-relaxed"
        style={!expanded && isLong ? collapsedStyle : undefined}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-xs mt-1 flex items-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" /> Tampilkan lebih ringkas
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Tampilkan lebih lengkap...
            </>
          )}
        </button>
      )}
    </div>
  )
}
