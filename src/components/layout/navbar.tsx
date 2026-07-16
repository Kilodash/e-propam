import Image from "next/image"
import Link from "next/link"
import AccountMenu from "./account-menu"
import BackToDashboard from "./back-to-dashboard"

export default function Navbar() {
  return (
    <nav className="bg-[#0F172A] border-b border-gray-700 px-4 py-1.5 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-4">
        <Image
          src="/logo propam pengaduan.png"
          alt="E-PROPAM"
          width={64}
          height={64}
          className="h-14 w-auto"
        />
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-2xl leading-tight">E-PROPAM</h1>
          <h2 className="text-gray-400 font-semibold text-xs leading-tight">MONITORING DUMAS</h2>
          <h2 className="text-gray-400 font-semibold text-xs leading-tight">BIDPROPAM POLDA JABAR</h2>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <BackToDashboard />
        <AccountMenu />
        <Image
          src="/logo-jaga-rawat.png"
          alt="Jaga Rawat Jawa Barat"
          width={200}
          height={80}
          className="h-22 w-auto"
        />
      </div>
    </nav>
  )
}
