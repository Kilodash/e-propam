"use client"

import { useState } from "react"
import { DocBlock } from "../paminal/doc-block"
import { SYARAT_MATERIIL, SYARAT_PEMBATAS, SYARAT_FORMIL } from "../paminal/paminal-shared"
import type { DocBlock as DocBlockType } from "../paminal/paminal-shared"

interface Props {
  gelarBlock: DocBlockType
  setGelarBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  lpABlock: DocBlockType
  setLpABlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  sprinRiksaBlock: DocBlockType
  setSprinRiksaBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  dp3dBlock: DocBlockType
  setDp3dBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
  showDp3dLimpah?: boolean
  onDp3dLimpahClick?: () => void
  gelarTitle?: string
  dp3dTitle?: string
}

export default function PemeriksaanAwalTab({
  gelarBlock, setGelarBlock,
  lpABlock, setLpABlock,
  sprinRiksaBlock, setSprinRiksaBlock,
  dp3dBlock, setDp3dBlock,
  customTemplates, onSimpanDok,
  showDp3dLimpah, onDp3dLimpahClick,
  gelarTitle = "Gelar Perkara Provos",
  dp3dTitle = "Berkas DP3D",
}: Props) {
  const [showPerdamaian, setShowPerdamaian] = useState(false)
  const [materiil, setMateriil] = useState<Record<string, boolean>>({})
  const [pembatas, setPembatas] = useState<Record<string, boolean>>({})
  const [formil, setFormil] = useState<Record<string, boolean>>({})

  const allMateriil = SYARAT_MATERIIL.every(s => materiil[s.key])
  const allPembatas = SYARAT_PEMBATAS.every(s => pembatas[s.key])
  const allFormil = SYARAT_FORMIL.every(s => formil[s.key])
  const canPerdamaian = allMateriil && allPembatas && allFormil

  return (
    <div className="space-y-3">
      <DocBlock title={gelarTitle} docType="gelar_provos" block={gelarBlock} setter={setGelarBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok}
        titleRight={
          <button
            onClick={() => setShowPerdamaian(true)}
            disabled={dp3dBlock.nomor !== ""}
            className="text-sm px-2 py-0.5 bg-amber-700 hover:bg-amber-600 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
            title={dp3dBlock.nomor ? `${dp3dTitle} sudah disimpan — perdamaian harus sebelum ${dp3dTitle}` : ""}
          >
            Perdamaian
          </button>
        }
      />
      <hr className="border-gray-700" />
      <DocBlock title="Laporan Polisi" docType="lp_a" block={lpABlock} setter={setLpABlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Sprin Riksa" docType="sprin_riksa" block={sprinRiksaBlock} setter={setSprinRiksaBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title={dp3dTitle} docType="dp3d" block={dp3dBlock} setter={setDp3dBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok}
        actionsRight={onDp3dLimpahClick ? (
          <button onClick={onDp3dLimpahClick}
            className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${showDp3dLimpah ? "bg-amber-700 text-white" : "border border-gray-600 text-gray-400 hover:text-white"}`}>
            Limpahkan
          </button>
        ) : undefined}
      />
      <hr className="border-gray-700" />

      {showPerdamaian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPerdamaian(false)} />
          <div className="relative z-10 max-w-md w-full mx-4 bg-[#0F172A] border border-gray-700 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Perdamaian (Restorative Justice)</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-300 mb-1">Syarat Materiil</p>
                {SYARAT_MATERIIL.map(s => (
                  <label key={s.key} className="flex items-start gap-1.5 text-gray-400 py-0.5 cursor-pointer">
                    <input type="checkbox" checked={materiil[s.key] ?? false} onChange={e => setMateriil(p => ({ ...p, [s.key]: e.target.checked }))} className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="font-semibold text-gray-300 mb-1">Prinsip Pembatas</p>
                {SYARAT_PEMBATAS.map(s => (
                  <label key={s.key} className="flex items-start gap-1.5 text-gray-400 py-0.5 cursor-pointer">
                    <input type="checkbox" checked={pembatas[s.key] ?? false} onChange={e => setPembatas(p => ({ ...p, [s.key]: e.target.checked }))} className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="font-semibold text-gray-300 mb-1">Syarat Formil</p>
                {SYARAT_FORMIL.map(s => (
                  <label key={s.key} className="flex items-start gap-1.5 text-gray-400 py-0.5 cursor-pointer">
                    <input type="checkbox" checked={formil[s.key] ?? false} onChange={e => setFormil(p => ({ ...p, [s.key]: e.target.checked }))} className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
              <div className={`text-sm font-semibold p-2 rounded ${canPerdamaian ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
                {canPerdamaian ? "Semua syarat terpenuhi. Perdamaian dapat dilakukan." : "Belum semua syarat terpenuhi."}
              </div>
              <button
                onClick={() => setShowPerdamaian(false)}
                disabled={!canPerdamaian}
                className="w-full px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40"
              >
                Ajukan Perdamaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
