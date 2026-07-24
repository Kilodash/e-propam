import Aksi1Disposisi from "@/components/pengaduan/aksi-1-disposisi"
import Aksi2Override from "@/components/pengaduan/aksi-2-override"
import Aksi3Kembalikan from "@/components/pengaduan/aksi-3-kembalikan"
import AksiDistribusi from "@/components/pengaduan/aksi-distribusi"
import AksiOverrideStatus from "@/components/pengaduan/aksi-override-status"
import AksiUnitProses from "@/components/pengaduan/aksi-unit-proses"
import AksiPaminal from "@/components/pengaduan/aksi-paminal"
import AksiProvos from "@/components/pengaduan/aksi-provos"
import AksiWabprof from "@/components/pengaduan/aksi-wabprof"
import type { AksiCardDefinition } from "./types"

export const aksiCardRegistry: Record<string, AksiCardDefinition> = {
  "saran-yanduan": {
    component: Aksi1Disposisi,
    defaultTitle: "Saran Yanduan",
    defaultVariant: "default",
    defaultOrder: 1,
    roles: ["admin", "yanduan"],
    requiredConfig: [],
  },
  "distribusi": {
    component: AksiDistribusi,
    defaultTitle: "Distribusi",
    defaultVariant: "default",
    defaultOrder: 2,
    roles: ["admin", "kabid", "yanduan", "paminal", "provos", "wabprof", "rehabpers", "polres"],
    requiredConfig: [],
  },
  "override-distribusi": {
    component: Aksi2Override,
    defaultTitle: "Over-ride Distribusi",
    defaultVariant: "warning",
    defaultOrder: 3,
    roles: ["admin", "yanduan"],
    requiredConfig: [],
  },
  "override-distribusi-status": {
    component: AksiOverrideStatus,
    defaultTitle: "Over-ride Distribusi + Status",
    defaultVariant: "warning",
    defaultOrder: 4,
    roles: ["admin", "yanduan"],
    requiredConfig: ["statusOptions"],
  },
  "proses-paminal": {
    component: AksiPaminal,
    defaultTitle: "Proses Paminal",
    defaultVariant: "danger",
    defaultOrder: 5,
    roles: ["admin", "paminal"],
    requiredConfig: [],
  },
  "proses-provos": {
    component: AksiProvos,
    defaultTitle: "Proses Provos",
    defaultVariant: "default",
    defaultOrder: 6,
    roles: ["admin", "provos"],
    requiredConfig: [],
  },
  "proses-wabprof": {
    component: AksiWabprof,
    defaultTitle: "Proses Wabprof",
    defaultVariant: "warning",
    defaultOrder: 7,
    roles: ["admin", "wabprof"],
    requiredConfig: [],
  },
  "proses-rehabpers": {
    component: AksiUnitProses,
    defaultTitle: "Proses Rehabpers",
    defaultVariant: "default",
    defaultOrder: 8,
    roles: ["admin", "rehabpers"],
    requiredConfig: [],
  },
  "kembalikan-surat": {
    component: Aksi3Kembalikan,
    defaultTitle: "Kembalikan Surat",
    defaultVariant: "danger",
    defaultOrder: 9,
    roles: ["admin", "yanduan", "kabid"],
    requiredConfig: ["kembalikanTargets"],
  },
}
