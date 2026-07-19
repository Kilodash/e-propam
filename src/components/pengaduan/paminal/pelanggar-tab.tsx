"use client"

import { Loader2, Send, RotateCcw, Plus, Trash2 } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import SearchableSelect from "@/components/ui/searchable-select"
import {
  PelanggarItem, CatalogOptions,
  PANGKAT_LIST, validateTelpon, validateNrp,
} from "./paminal-shared"

interface Props {
  pelanggarList: PelanggarItem[]
  setPelanggarList: React.Dispatch<React.SetStateAction<PelanggarItem[]>>
  catalogPasal: CatalogOptions[]
  catalogWujud: CatalogOptions[]
  loading: boolean
  error: string | null
  success: string | null
  onSavePelanggar: () => Promise<void>
  onReset: () => void
  updateGajamada: boolean
}

export default function PelanggarTab({
  pelanggarList, setPelanggarList,
  catalogPasal, catalogWujud,
  loading, error, success,
  onSavePelanggar, onReset,
  updateGajamada,
}: Props) {
  const displayList = pelanggarList.length === 0
    ? [{ key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "Anggota Polri", prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "", kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "", telpon: "", pendidikan: "", jenis_kelamin: "laki-laki", wujud: "", kategori: "", sub_kategori: "", pasal_disiplin: [] as string[], pasal_kke: [] as string[] }]
    : pelanggarList

  const defaultItem: PelanggarItem = { key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "", prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "", kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "", telpon: "", pendidikan: "", jenis_kelamin: "", wujud: "", kategori: "", sub_kategori: "", pasal_disiplin: [], pasal_kke: [] }

  return (
    <div className="space-y-2">
      {displayList.map((p, idx) => {
        const realIdx = pelanggarList.findIndex(x => x.key === p.key)
        const updater = (up: Partial<PelanggarItem>) => {
          if (pelanggarList.length === 0) {
            setPelanggarList([{ ...defaultItem, ...up }])
          } else {
            const next = [...pelanggarList]
            next[realIdx >= 0 ? realIdx : 0] = { ...next[realIdx >= 0 ? realIdx : 0], ...up }
            setPelanggarList(next)
          }
        }
        return (
          <div key={p.key} className="bg-[#1E293B] border border-gray-600 rounded p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-yellow-400">Pelanggar {realIdx >= 0 ? realIdx + 1 : 1}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPelanggarList(prev => [...prev, { key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "", prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "", kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "", telpon: "", pendidikan: "", jenis_kelamin: "", wujud: "", kategori: "", sub_kategori: "", pasal_disiplin: [], pasal_kke: [] }])}
                  className="text-sm text-blue-400 hover:text-blue-300">+ Tambah</button>
                {pelanggarList.length > 1 && (
                  <button onClick={() => setPelanggarList(prev => prev.filter(x => x.key !== p.key))}
                    className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <p className="text-sm text-gray-500">Nama <span className="text-red-400">*</span></p>
                <input type="text" value={p.nama} onChange={e => updater({ nama: e.target.value })} maxLength={100} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pangkat <span className="text-red-400">*</span></p>
                <select value={p.pangkat} onChange={e => updater({ pangkat: e.target.value })} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                  <option value="">--</option>
                  {PANGKAT_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <p className="text-sm text-gray-500">NRP / NIP <span className="text-red-400">*</span></p>
                <input type="text" value={p.nrp} onChange={e => {
                  const val = e.target.value.replace(/\D/g, "")
                  const up: Partial<PelanggarItem> = { nrp: val }
                  if (val.length >= 4) {
                    const clean = val
                    if (clean.length === 8) {
                      const yy = parseInt(clean.slice(0, 2))
                      const mm = parseInt(clean.slice(2, 4))
                      if (mm >= 1 && mm <= 12) {
                        const year = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy
                        up.tanggal_lahir = `${year}-${String(mm).padStart(2, "0")}-01`
                      }
                    } else if (clean.length === 16 || clean.length === 18) {
                      const y = clean.slice(0, 4)
                      const m = clean.slice(4, 6)
                      const d = clean.slice(6, 8)
                      up.tanggal_lahir = `${y}-${m}-${d}`
                    }
                  }
                  updater(up)
                }} maxLength={18}
                  placeholder="Polri: 8 digit (YYMM+urut) | PNS: 16/18 digit"
                  className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-500" />
                {(() => { const v = validateNrp(p.nrp, p.tanggal_lahir); return v.warning ? <p className={v.valid ? "text-sm text-yellow-400 mt-0.5" : "text-sm text-red-400 mt-0.5"}>{v.warning}</p> : null })()}
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Lahir</p>
                <DateInput value={p.tanggal_lahir} onChange={val => updater({ tanggal_lahir: val })}
                  className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <p className="text-sm text-gray-500">Tempat Lahir</p>
                <input type="text" value={p.tempat_lahir} onChange={e => updater({ tempat_lahir: e.target.value })}
                  className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500">No. Telepon</p>
                <input type="text" value={p.telpon} onChange={e => updater({ telpon: e.target.value.replace(/\D/g, "") })} maxLength={15}
                  className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                {(() => { const v = validateTelpon(p.telpon); return v.warning ? <p className="text-sm text-red-400 mt-0.5">{v.warning}</p> : null })()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <p className="text-sm text-gray-500">Pendidikan</p>
                <select value={p.pendidikan} onChange={e => updater({ pendidikan: e.target.value })}
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
                <p className="text-sm text-gray-500">Jenis Kelamin</p>
                <select value={p.jenis_kelamin} onChange={e => updater({ jenis_kelamin: e.target.value })}
                  className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                  <option value="">--</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <p className="text-sm text-gray-500">Jabatan</p>
                <input type="text" value={p.jabatan} onChange={e => updater({ jabatan: e.target.value })} maxLength={100} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Kesatuan</p>
                <input type="text" value="POLDA JAWA BARAT" disabled className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-400 rounded px-1.5 h-8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <p className="text-sm text-gray-500">Jenis Personel <span className="text-red-400">*</span></p>
                <select value={p.prepetrator_type} onChange={e => updater({ prepetrator_type: e.target.value })}
                  className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                  <option value="">--</option>
                  <option value="Anggota Polri">Anggota Polri</option>
                  <option value="Polri">Polri</option>
                  <option value="PNS">PNS</option>
                </select>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sub Fungsi <span className="text-red-400">*</span></p>
                <select value={p.functional} onChange={e => updater({ functional: e.target.value })}
                  className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                  <option value="">--</option>
                  {catalogWujud.map(w => <option key={w.value} value={w.value}>{w.value}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Keterangan Tambahan</p>
              <textarea value={p.prepetrator_description} onChange={e => updater({ prepetrator_description: e.target.value })}
                placeholder="Keterangan tambahan (opsional)..."
                className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 py-1 min-h-[30px] placeholder:text-gray-500" />
            </div>

            <div className="border-t border-gray-600 pt-1.5">
              <p className="text-sm text-gray-500 mb-0.5">Wujud Perbuatan <span className="text-red-400">*</span></p>
              <SearchableSelect
                options={catalogWujud.map(w => ({ value: w.value, label: w.value }))}
                value={p.wujud}
                onChange={val => {
                  const found = catalogWujud.find(w => w.value === val)
                  updater({ wujud: val, kategori: found?.kategori ?? "", sub_kategori: found?.sub_kategori ?? "" })
                }}
                placeholder="Cari wujud perbuatan..."
              />
              {p.kategori && (
                <div className="text-sm text-gray-400 mt-1">
                  Kategori: <span className="text-blue-300">{p.kategori}</span> → Sub: <span className="text-blue-300">{p.sub_kategori}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Pasal Disiplin <span className="text-red-400">*</span></p>
              <div className="space-y-1">
                {p.pasal_disiplin.map((pv, pi) => (
                  <div key={pi} className="flex items-center gap-1">
                    <span className="text-sm text-blue-300 flex-1">{pv}</span>
                    <button onClick={() => updater({ pasal_disiplin: p.pasal_disiplin.filter((_, i) => i !== pi) })}
                      className="text-red-400 hover:text-red-300 text-sm">✕</button>
                  </div>
                ))}
                <select value="" onChange={e => {
                  if (e.target.value && !p.pasal_disiplin.includes(e.target.value)) {
                    updater({ pasal_disiplin: [...p.pasal_disiplin, e.target.value] })
                  }
                }} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-7">
                  <option value="">+ Tambah pasal disiplin...</option>
                  {(() => { const seen = new Set<string>(); return catalogPasal.filter(c => c.type && /PPRI/i.test(c.type)).filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true }).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  )) })()}
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Pasal Kode Etik (KKE) <span className="text-red-400">*</span></p>
              <div className="space-y-1">
                {p.pasal_kke.map((pv, pi) => (
                  <div key={pi} className="flex items-center gap-1">
                    <span className="text-sm text-purple-300 flex-1">{pv}</span>
                    <button onClick={() => updater({ pasal_kke: p.pasal_kke.filter((_, i) => i !== pi) })}
                      className="text-red-400 hover:text-red-300 text-sm">✕</button>
                  </div>
                ))}
                <select value="" onChange={e => {
                  if (e.target.value && !p.pasal_kke.includes(e.target.value)) {
                    updater({ pasal_kke: [...p.pasal_kke, e.target.value] })
                  }
                }} className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-7">
                  <option value="">+ Tambah pasal KKE...</option>
                  {(() => { const seen = new Set<string>(); return catalogPasal.filter(c => c.type && /PERPOL/i.test(c.type)).filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true }).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  )) })()}
                </select>
              </div>
            </div>
          </div>
        )
      })}
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
