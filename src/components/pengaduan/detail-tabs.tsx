"use client"

import { useState } from "react"
import type { Pengaduan, TimelineEntry } from "@/types"
import TimelineStepper from "./timeline-stepper"
import ExpandableText from "./expandable-text"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface TabProps {
  pengaduan: Pengaduan
  timeline: TimelineEntry[]
}

const tabs = [
  { key: "laporan", label: "Info Laporan" },
  { key: "pelapor", label: "Info Pelapor" },
  { key: "terlapor", label: "Info Terlapor" },
  { key: "bukti", label: "Bukti" },
  { key: "timeline", label: "Timeline" },
]

function formatDate(d: string | null) {
  if (!d) return "-"
  return format(new Date(d), "dd MMM yyyy, HH:mm", { locale: id })
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-gray-200">{value}</p>
    </div>
  )
}

export default function DetailTabs({ pengaduan, timeline }: TabProps) {
  const [active, setActive] = useState("laporan")

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-700 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active === tab.key
                ? "border-[#0369A1] text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-4 min-h-[200px]">
        {active === "laporan" && (
          <div className="space-y-3 text-sm">
            <DetailRow label="No. Laporan" value={pengaduan.id} />
            <DetailRow label="Kategori" value={pengaduan.category ?? "-"} />
            <DetailRow label="Status" value={pengaduan.status_label ?? "-"} />
            <DetailRow
              label="Posisi Kasus"
              value={pengaduan.case_position ?? "-"}
            />
            <DetailRow
              label="Fungsi Kepolisian"
              value={pengaduan.disposisi_police_function ?? "-"}
            />
            <DetailRow
              label="Tanggal Dibuat"
              value={formatDate(pengaduan.created_date)}
            />
            {pengaduan.summary && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Ringkasan</p>
                <ExpandableText text={pengaduan.summary} maxLines={5} className="text-gray-200" />
              </div>
            )}
            {pengaduan.content && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Isi Laporan</p>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {pengaduan.content}
                </p>
              </div>
            )}
          </div>
        )}

        {active === "pelapor" && (
          <div className="space-y-3 text-sm">
            <DetailRow
              label="Nama Pengirim"
              value={pengaduan.pengirim ?? "-"}
            />
            <DetailRow label="Telepon" value={pengaduan.phone_no ?? "-"} />
            <DetailRow label="Email" value={pengaduan.email ?? "-"} />
            <DetailRow label="Sumber" value={pengaduan.source ?? "-"} />
          </div>
        )}

        {active === "terlapor" && (
          <p className="text-gray-400 text-sm py-4">
            Data terlapor tersedia melalui sync detail Gajamada
          </p>
        )}

        {active === "bukti" && (
          <p className="text-gray-400 text-sm py-4">
            Bukti pendukung tersedia melalui sync detail Gajamada
          </p>
        )}

        {active === "timeline" && <TimelineStepper entries={timeline} />}
      </div>
    </div>
  )
}
