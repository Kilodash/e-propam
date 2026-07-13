import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <p className="text-gray-400">Halaman tidak ditemukan</p>
        <Link href="/dashboard">
          <Button className="bg-[#0369A1]">Kembali ke Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
