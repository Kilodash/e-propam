export default function DashboardLoading() {
  return (
    <div className="h-full flex flex-col overflow-hidden p-6">
      <div className="flex-shrink-0 mb-4">
        <div className="flex gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex-1 bg-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-3 w-20 bg-white/20 rounded mb-2" />
              <div className="h-6 w-10 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-white/5 rounded-lg overflow-hidden animate-pulse">
        <div className="space-y-3 p-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-8 bg-white/10 rounded" />
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-4 w-20 bg-white/10 rounded" />
              <div className="h-4 flex-1 bg-white/10 rounded" />
              <div className="h-4 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
