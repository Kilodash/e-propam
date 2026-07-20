"use client"

import { Plus } from "lucide-react"
import SidangEntryComp from "./sidang-entry"
import type { SidangEntry } from "./provos-shared"
import { emptySidangEntry } from "./provos-shared"
import type { PelanggarItem } from "../paminal/paminal-shared"

interface Props {
  sidangList: SidangEntry[]
  onUpdateList: (list: SidangEntry[]) => void
  pelanggarOptions: PelanggarItem[]
  customTemplates: Record<string, string>
}

export default function SidangTab({ sidangList, onUpdateList, pelanggarOptions, customTemplates }: Props) {
  function handleUpdate(key: string, updates: Partial<SidangEntry>) {
    const next = sidangList.map(s => s.key === key ? { ...s, ...updates } : s)
    onUpdateList(next)
  }

  function handleDelete(key: string) {
    if (sidangList.length <= 1) return
    onUpdateList(sidangList.filter(s => s.key !== key))
  }

  function handleAdd() {
    onUpdateList([...sidangList, emptySidangEntry()])
  }

  return (
    <div className="space-y-3">
      {sidangList.map((entry, idx) => (
        <SidangEntryComp
          key={entry.key}
          entry={entry}
          index={idx}
          pelanggarOptions={pelanggarOptions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          customTemplates={customTemplates}
        />
      ))}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-1 text-sm px-2 py-1.5 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded"
      >
        <Plus className="w-4 h-4" /> Tambah Sidang Baru
      </button>
    </div>
  )
}
