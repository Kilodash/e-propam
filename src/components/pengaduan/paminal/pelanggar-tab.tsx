"use client"

import { useState } from "react"
import { Loader2, Send, RotateCcw, Trash2 } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import SearchableSelect from "@/components/ui/searchable-select"
import {
  PelanggarItem, CatalogOptions,
  validateTelpon, validateNrp,
} from "./paminal-shared"

function isPns(t: string) { return t === "PNS" }

interface Props {
  pelanggarList: PelanggarItem[]
  setPelanggarList: React.Dispatch<React.SetStateAction<PelanggarItem[]>>
  catalogPasal: CatalogOptions[]
  catalogWujud: CatalogOptions[]
  catalogPangkat: string[]
  catalogFunctional: string[]
  loading: boolean
  error: string | null
  success: string | null
  onSavePelanggar: () => Promise<void>
  onReset: () => void
  updateGajamada: boolean
}

const emptyItem = (): PelanggarItem => ({
  key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "Polri",
  prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "",
  kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "",
  telpon: "", pendidikan: "", jenis_kelamin: "laki-laki", wujud: "",
  kategori: "", sub_kategori: "", pasal_disiplin: [], pasal_kke: [],
  graduation_year: "",
})

export default function PelanggarTab({
  pelanggarList, setPelanggarList,
  catalogPasal, catalogWujud,
  catalogPangkat, catalogFunctional,
  loading, error, success,
  onSavePelanggar, onReset,
  updateGajamada,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  const displayList = pelanggarList.length === 0 ? [emptyItem()] : pelanggarList
  const safeIdx = Math.min(activeIdx, Math.max(0, displayList.length - 1))
  const currentItem = displayList[safeIdx] || emptyItem()

  const realIdx = pelanggarList.findIndex(x => x.key === currentItem.key)
  const item = realIdx >= 0 ? pelanggarList[realIdx] : currentItem

  function handleAddPelanggar() {
    const newItem = emptyItem()
    setPelanggarList(prev => [...prev, newItem])
    setActiveIdx(pelanggarList.length)
  }

  function handleDeletePelanggar(keyToDelete: string, idxToDelete: number) {
    setPelanggarList(prev => prev.filter(x => x.key !== keyToDelete))
    if (activeIdx >= idxToDelete && activeIdx > 0) {
      setActiveIdx(activeIdx - 1)
    }
  }

  const updater = (up: Partial<PelanggarItem>) => {
    if (pelanggarList.length === 0) {
      setPelanggarList([{ ...emptyItem(), ...up }])
    } else {
      const next = [...pelanggarList]
      const targetIdx = realIdx >= 0 ? realIdx : 0
      next[targetIdx] = { ...next[targetIdx], ...up }
      setPelanggarList(next)
    }
  }

  const ranks = isPns(item.prepetrator_type)
    ? catalogPangkat.filter(r => /PENATA|PENGATUR|JURU/.test(r))
    : catalogPangkat.filter(r => !/PENATA|PENGATUR|JURU/.test(r))
  const nrpLabel = isPns(item.prepetrator_type) ? "NIP" : "NRP"
  const nrpPlaceholder = isPns(item.prepetrator_type) ? "NIP: 18 digit" : "NRP: 8 digit (YYMM+urut)"
  const countLabel = `${displayList.length} Terduga Pelanggar`

  return (
    <div className="space-y-2">
      {/* Tab Navigation for Multiple Offenders */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-1.5 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 mr-1 shrink-0">
            {countLabel}
          </span>
          {displayList.map((p, idx) => {
            const isTabActive = idx === safeIdx
            const shortName = p.nama ? (p.nama.split(" ")[0] || `Pelanggar #${idx + 1}`) : `Pelanggar #${idx + 1}`

            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shrink-0 ${
                  isTabActive
                    ? "bg-[#0369A1] text-white font-semibold shadow-sm"
                    : "bg-[#1E293B] text-gray-400 hover:text-gray-200 border border-gray-700"
                }`}
              >
                <span>{shortName}</span>
                {displayList.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePelanggar(p.key, idx)
                    }}
                    className="hover:text-red-300 text-gray-400 p-0.5 rounded cursor-pointer ml-0.5"
                    title="Hapus pelanggar ini"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleAddPelanggar}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-[#1E293B] hover:bg-gray-800 border border-blue-500/40 px-2.5 py-1 rounded flex items-center gap-1 shrink-0"
        >
          + Tambah Pelanggar
        </button>
      </div>

      {/* Form Card for Active Offender */}
      <div className="bg-[#1E293B] border border-gray-600 rounded p-2.5 space-y-1.5">
        <div className="flex items-center justify-between border-b border-gray-700/60 pb-1 mb-1">
          <p className="text-sm font-semibold text-yellow-400">
            Form Terduga Pelanggar #{safeIdx + 1} {item.nama ? `— ${item.nama}` : ""}
          </p>
        </div>

        {/* 1. Jenis Personel */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500">Jenis Personel <span className="text-red-400">*</span></p>
            <select value={item.prepetrator_type} onChange={e => {
              const nextType = e.target.value
              updater({
                prepetrator_type: nextType,
                pangkat: "",
                nrp: "",
              })
            }}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
              <option value="">--</option>
              <option value="Polri">Polri</option>
              <option value="PNS">PNS</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pangkat <span className="text-red-400">*</span></p>
            <select value={item.pangkat} onChange={e => updater({ pangkat: e.target.value })} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
              <option value="">--</option>
              {ranks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* 2. Nama + NRP/NIP */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500">Nama <span className="text-red-400">*</span></p>
            <input type="text" value={item.nama} onChange={e => updater({ nama: e.target.value })} maxLength={100} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{nrpLabel} <span className="text-red-400">*</span></p>
            <input type="text" value={item.nrp} onChange={e => {
              const val = e.target.value.replace(/\D/g, "")
              const up: Partial<PelanggarItem> = { nrp: val }
              if (!isPns(item.prepetrator_type) && val.length >= 4) {
                if (val.length === 8) {
                  const yy = parseInt(val.slice(0, 2))
                  const mm = parseInt(val.slice(2, 4))
                  if (mm >= 1 && mm <= 12) {
                    const year = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy
                    up.tanggal_lahir = `${year}-${String(mm).padStart(2, "0")}-01`
                  }
                }
              } else if (isPns(item.prepetrator_type) && val.length === 18) {
                const y = val.slice(0, 4)
                const m = val.slice(4, 6)
                const d = val.slice(6, 8)
                up.tanggal_lahir = `${y}-${m}-${d}`
              }
              updater(up)
            }} maxLength={isPns(item.prepetrator_type) ? 18 : 8}
              placeholder={nrpPlaceholder}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-500" />
            {(() => { const v = validateNrp(item.nrp, item.tanggal_lahir, item.prepetrator_type); return v.warning ? <p className={v.valid ? "text-sm text-yellow-400 mt-0.5" : "text-sm text-red-400 mt-0.5"}>{v.warning}</p> : null })()}
          </div>
        </div>

        {/* 3. Tgl Lahir + Tempat Lahir */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500">Tanggal Lahir</p>
            <DateInput value={item.tanggal_lahir} onChange={val => updater({ tanggal_lahir: val })}
              className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tempat Lahir</p>
            <input type="text" value={item.tempat_lahir} onChange={e => updater({ tempat_lahir: e.target.value })}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
          </div>
        </div>

        {/* 4. Jabatan + Kesatuan */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500">Jabatan</p>
            <input type="text" value={item.jabatan} onChange={e => updater({ jabatan: e.target.value })} maxLength={100} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Kesatuan</p>
            <input type="text" value="POLDA JAWA BARAT" disabled className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-400 rounded px-1.5 h-8" />
          </div>
        </div>

        {/* 5. Pendidikan + Tgl Lulus */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500">Pendidikan</p>
            <select value={item.pendidikan} onChange={e => updater({ pendidikan: e.target.value })}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
              <option value="">--</option>
              <option value="AKPOL">AKPOL</option>
              <option value="SIPSS">SIPSS</option>
              <option value="BINTARA">BINTARA</option>
              <option value="TAMTAMA">TAMTAMA</option>
              <option value="SIP">SIP</option>
              <option value="PAG">PAG</option>
              <option value="SEKOLAH BINTARA POLISI">SEKOLAH BINTARA POLISI</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tahun Lulus</p>
            <input type="text" value={item.graduation_year} onChange={e => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4)
              updater({ graduation_year: val })
            }} maxLength={4} placeholder="YYYY"
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-500" />
          </div>
        </div>

        {/* 6. Jenis Kelamin + Telepon */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500">Jenis Kelamin</p>
            <select value={item.jenis_kelamin} onChange={e => updater({ jenis_kelamin: e.target.value })}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
              <option value="">--</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-gray-500">No. Telepon</p>
            <input type="text" value={item.telpon} onChange={e => updater({ telpon: e.target.value.replace(/\D/g, "").slice(0, 15) })} maxLength={15}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
            {(() => { const v = validateTelpon(item.telpon); return v.warning ? <p className="text-sm text-red-400 mt-0.5">{v.warning}</p> : null })()}
          </div>
        </div>

        {/* 8. Wujud Perbuatan */}
        <div>
          <p className="text-base text-gray-500 mb-0.5">Wujud Perbuatan <span className="text-red-400">*</span></p>
          <SearchableSelect
            options={catalogWujud.map(w => ({ value: w.value, label: w.value }))}
            value={item.wujud}
            onChange={val => {
              const found = catalogWujud.find(w => w.value === val)
              updater({ wujud: val, kategori: found?.kategori ?? "", sub_kategori: found?.sub_kategori ?? "" })
            }}
            placeholder="Cari wujud perbuatan..."
          />
          {item.kategori && (
            <div className="text-sm text-gray-400 mt-1">
              Kategori: <span className="text-blue-300">{item.kategori}</span> → Sub: <span className="text-blue-300">{item.sub_kategori}</span>
            </div>
          )}
        </div>

        {/* 9. Pasal Disiplin + KKE */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-sm text-gray-500 mb-0.5">Pasal Disiplin <span className="text-red-400">*</span></p>
            <div className="space-y-1">
              {item.pasal_disiplin.map((pv, pi) => (
                <div key={pi} className="flex items-center gap-1">
                  <span className="text-sm text-blue-300 flex-1">{pv}</span>
                  <button onClick={() => updater({ pasal_disiplin: item.pasal_disiplin.filter((_, i) => i !== pi) })}
                    className="text-red-400 hover:text-red-300 text-sm">✕</button>
                </div>
              ))}
              <select value="" onChange={e => {
                if (e.target.value && !item.pasal_disiplin.includes(e.target.value)) {
                  updater({ pasal_disiplin: [...item.pasal_disiplin, e.target.value] })
                }
              }} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-7">
                <option value="">+ Tambah</option>
                {(() => { const seen = new Set<string>(); return catalogPasal.filter(c => c.type && /PPRI/i.test(c.type)).filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true }).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                )) })()}
              </select>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-0.5">Pasal KKE <span className="text-red-400">*</span></p>
            <div className="space-y-1">
              {item.pasal_kke.map((pv, pi) => (
                <div key={pi} className="flex items-center gap-1">
                  <span className="text-sm text-purple-300 flex-1">{pv}</span>
                  <button onClick={() => updater({ pasal_kke: item.pasal_kke.filter((_, i) => i !== pi) })}
                    className="text-red-400 hover:text-red-300 text-sm">✕</button>
                </div>
              ))}
              <select value="" onChange={e => {
                if (e.target.value && !item.pasal_kke.includes(e.target.value)) {
                  updater({ pasal_kke: [...item.pasal_kke, e.target.value] })
                }
              }} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-7">
                <option value="">+ Tambah</option>
                {(() => { const seen = new Set<string>(); return catalogPasal.filter(c => c.type && /PERPOL/i.test(c.type)).filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true }).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                )) })()}
              </select>
            </div>
          </div>
        </div>

        {/* 10. Keterangan Tambahan */}
        <div>
          <p className="text-sm text-gray-500">Keterangan Tambahan</p>
          <textarea value={item.prepetrator_description} onChange={e => updater({ prepetrator_description: e.target.value })}
            placeholder="Keterangan tambahan (opsional)..."
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 py-1 min-h-[30px] placeholder:text-gray-500" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-600">
        <button onClick={onSavePelanggar} disabled={loading}
          className="flex items-center gap-1 text-sm px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Simpan ke Gajamada
        </button>
        <button onClick={onReset}
          className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-300 rounded hover:text-white">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        {error && <p className="text-sm text-red-400 flex-1">{error}</p>}
        {success && <p className="text-sm text-green-400 flex-1">{success}</p>}
      </div>
    </div>
  )
}
