const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: { tile: 'bg-gray-900', decor: 'bg-gray-700' },
    green: { tile: 'bg-gray-700', decor: 'bg-gray-500' },
    purple: { tile: 'bg-gray-600', decor: 'bg-gray-400' },
    orange: { tile: 'bg-gray-800', decor: 'bg-gray-600' },
    teal: { tile: 'bg-gray-500', decor: 'bg-gray-400' },
    red: { tile: 'bg-gray-950', decor: 'bg-gray-700' },
  }

  const { tile, decor } = colorClasses[color] || colorClasses.blue

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute -right-5 -top-5 h-24 w-24 rounded-full ${decor} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold text-gray-900 lg:text-3xl">{value}</p>
        </div>
        <div className={`shrink-0 rounded-xl ${tile} p-3 shadow-sm`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default StatCard
