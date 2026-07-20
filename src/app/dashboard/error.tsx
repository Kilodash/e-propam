"use client"

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-red-400 text-lg font-semibold mb-2">Gagal Memuat Dashboard</p>
        <p className="text-gray-400 text-sm mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded text-sm"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
