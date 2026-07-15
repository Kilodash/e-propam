"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Pilih...", className = "" }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : options.slice(0, 50)

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (open) setSearch("") }}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-[#1E293B] border border-gray-600 rounded text-gray-200 hover:border-gray-500 focus:outline-none focus:border-[#0369A1]"
      >
        <span className={selected ? "text-gray-200" : "text-gray-500 truncate"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#1E293B] border border-gray-600 rounded shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-600">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              autoFocus
              className="flex-1 text-xs bg-transparent text-gray-200 placeholder:text-gray-500 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">Tidak ditemukan</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch("") }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#0F172A] ${
                    opt.value === value ? "text-[#0369A1] bg-[#0F172A]" : "text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
