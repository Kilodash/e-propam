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
  const [month, setMonth] = useState<Date | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? new Date(value + "T00:00:00") : undefined
  const display = selected && isValid(selected)
    ? format(selected, "d MMMM yyyy", { locale: id })
    : ""

  useEffect(() => {
    if (open && value) {
      const d = new Date(value + "T00:00:00")
      if (isValid(d)) setMonth(d)
    }
  }, [open, value])

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
            month={month}
            onMonthChange={setMonth}
            onSelect={day => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"))
                setOpen(false)
              }
            }}
            locale={id}
            captionLayout="dropdown"
            formatters={{ formatWeekdayName: day => format(day, "EEEEEE", { locale: id }) }}
          />
        </div>
      )}
    </div>
  )
}
