"use client"

import { useState, useRef, useEffect } from "react"
import { DayPicker } from "react-day-picker"
import { id } from "date-fns/locale"
import { format, isValid } from "date-fns"
import { CalendarDays } from "lucide-react"
import "react-day-picker/style.css"

interface DateInputProps {
  value: string // YYYY-MM-DD
  onChange: (val: string) => void
  className?: string
  placeholder?: string
}

export function DateInput({ value, onChange, className = "", placeholder = "Pilih tanggal" }: DateInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? new Date(value + "T00:00:00") : undefined
  const display = selected && isValid(selected)
    ? format(selected, "d MMMM yyyy", { locale: id })
    : ""

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 w-full text-left px-1.5 h-7 rounded border border-gray-600 bg-[#1E293B] text-xs ${display ? "text-gray-200" : "text-gray-500"} ${className}`}
      >
        <CalendarDays className="w-3 h-3 shrink-0 text-gray-400" />
        {display || placeholder}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-[#0F172A] border border-gray-700 rounded-lg shadow-xl p-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={day => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"))
                setOpen(false)
              }
            }}
            locale={id}
            captionLayout="dropdown"
            startMonth={new Date(2020, 0)}
            endMonth={new Date(2030, 11)}
            classNames={{
              root: "text-xs text-gray-200 w-[260px]",
              month_caption: "flex items-center justify-between gap-1 mb-2 text-sm font-semibold text-white",
              caption_label: "hidden", // Hide the text label when dropdown is active
              months_dropdown: "flex-1 bg-[#1E293B] border border-gray-600 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none appearance-none",
              years_dropdown: "w-[80px] bg-[#1E293B] border border-gray-600 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none appearance-none",
              dropdown: "bg-[#1E293B] border border-gray-600 text-gray-200 text-xs rounded px-1 py-0.5",
              nav: "flex items-center gap-1",
              button_previous: "p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white",
              button_next: "p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white",
              weeks: "border-collapse w-full",
              weekdays: "text-gray-500",
              weekday: "w-8 h-8 text-center text-[10px] font-medium",
              week: "flex justify-between",
              day: "w-8 h-8 flex items-center justify-center",
              day_button: "w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-200 hover:text-white transition-colors text-xs",
              selected: "bg-[#0369A1] text-white rounded",
              today: "font-bold text-blue-400",
              outside: "text-gray-600",
            }}
          />
        </div>
      )}
    </div>
  )
}
