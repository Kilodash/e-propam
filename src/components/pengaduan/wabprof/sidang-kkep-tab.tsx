"use client"

import { Plus } from "lucide-react"
import type { PelanggarItem } from "../paminal/paminal-shared"
import type { SidangKkepEntry } from "./wabprof-shared"
import { emptySidangKkepEntry } from "./wabprof-shared"
import SidangKkepEntryComp from "./sidang-kkep-entry"

interface Props {
  sidangList: SidangKkepEntry[]
  setSidangList: React.Dispatch<React.SetStateAction<SidangKkepEntry[]>>
  pelanggarOptions: PelanggarItem[]
  customTemplates: Record<string, string>
  onSimpanKhd?: (key: string) => Promise<void>
}

export default function SidangKkepTab({
  sidangList, setSidangList, pelanggarOptions, customTemplates, onSimpanKhd,
}: Props) {
  function handleAddSidang() {
    setSidangList(prev => [...prev, emptySidangKkepEntry()])
  }

  function handleUpdate(key: string, updates: Partial<SidangKkepEntry>) {
    setSidangList(prev => prev.map(s => s.key === key ? { ...s, ...updates } : s))
  }

  function handleDelete(key: string) {
    if (confirm("Hapus data persidangan ini?")) {
      setSidangList(prev => prev.filter(s => s.key !== key))
    }
  }

  // Hitung usedOtherKeys per entry
  const usedOtherKeysMap = new Map<string, Set<string>>()
  for (const s of sidangList) {
    const set = new Set<string>()
    for (const other of sidangList) {
      if (other.key !== s.key) {
        for (const pk of (other.pelanggarKeys || [])) set.add(pk)
      }
    }
    usedOtherKeysMap.set(s.key, set)
  }

  return (
    <div className="space-y-3">
      {sidangList.map((entry, idx) => (
        <SidangKkepEntryComp
          key={entry.key}
          entry={entry}
          index={idx}
          pelanggarOptions={pelanggarOptions}
          usedOtherKeys={usedOtherKeysMap.get(entry.key) || new Set()}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          customTemplates={customTemplates}
          onSimpanKhd={onSimpanKhd}
        />
      ))}

      <button onClick={handleAddSidang}
        className="flex items-center gap-1 text-sm px-3 py-1.5 bg-[#0F172A] border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded transition-colors w-full justify-center">
        <Plus className="w-4 h-4" /> Tambah Pelaksanaan Sidang KKEP
      </button>
    </div>
  )
}
