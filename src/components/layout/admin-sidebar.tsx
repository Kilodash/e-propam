"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, GitBranch, Layout, Filter } from "lucide-react"

const links = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/unit-mapping", label: "Unit Mapping", icon: GitBranch },
  { href: "/admin/layout", label: "Card Layout", icon: Layout },
  { href: "/admin/status-filter", label: "Filter Status", icon: Filter },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-[#0F172A] border-r border-gray-700 min-h-screen p-4">
      <h3 className="text-gray-400 text-xs uppercase mb-4">Admin</h3>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${
                active
                  ? "bg-[#0369A1] text-white"
                  : "text-gray-300 hover:bg-[#1e293b]"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
