import { useEffect, useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { FiCalendar, FiDollarSign, FiCheckCircle, FiClock, FiBarChart2 } from 'react-icons/fi'
import { dashboardService } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/formatCurrency'

const GROUP_OPTIONS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' }
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-xl px-4 py-3 min-w-[190px]">
      <p className="text-xs font-medium text-gray-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 py-0.5">
          <span className="flex items-center gap-2 text-sm text-gray-300">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-sm font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

const SummaryCard = ({ title, value, icon: Icon, accent }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${accent} opacity-10`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
      </div>
      <div className={`rounded-xl p-2.5 ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
)

const RevenueChart = () => {
  const [data, setData] = useState([])
  const [totals, setTotals] = useState(null)
  const [groupBy, setGroupBy] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedDates, setAppliedDates] = useState({ startDate: '', endDate: '' })
  const [loading, setLoading] = useState(true)

  const fetchRevenue = useCallback(async () => {
    setLoading(true)
    try {
      const response = await dashboardService.getRevenueChart({
        startDate: appliedDates.startDate,
        endDate: appliedDates.endDate,
        groupBy
      })
      if (response.success) {
        setData(response.data.data || [])
        setTotals(response.data.totals || null)
      }
    } catch (error) {
      console.error('Failed to fetch revenue chart:', error)
    } finally {
      setLoading(false)
    }
  }, [appliedDates, groupBy])

  useEffect(() => {
    const timer = setTimeout(fetchRevenue, 300)
    return () => clearTimeout(timer)
  }, [fetchRevenue])

  const handleApply = () => {
    setAppliedDates({ startDate, endDate })
  }

  const handleReset = () => {
    setStartDate('')
    setEndDate('')
    setAppliedDates({ startDate: '', endDate: '' })
  }

  const datesChanged = startDate !== appliedDates.startDate || endDate !== appliedDates.endDate

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gray-900 p-2.5">
            <FiBarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
            <p className="text-sm text-gray-500">Track total, paid and pending amounts over time</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* GroupBy segmented control */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {GROUP_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setGroupBy(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  groupBy === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
              <FiCalendar size={15} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none"
                title="Start date"
              />
              <span className="text-xs text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none"
                title="End date"
              />
            </div>
            <button
              onClick={handleApply}
              disabled={!datesChanged}
              className="rounded-lg bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              disabled={!startDate && !endDate && !appliedDates.startDate && !appliedDates.endDate}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Summary Cards */}
        {totals && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard title="Total Amount" value={totals.total} icon={FiDollarSign} accent="bg-gray-700" />
            <SummaryCard title="Paid Amount" value={totals.paid} icon={FiCheckCircle} accent="bg-gray-900" />
            <SummaryCard title="Pending Amount" value={totals.pending} icon={FiClock} accent="bg-gray-400" />
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="flex h-[340px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[340px] flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-100 p-4">
              <FiBarChart2 size={32} className="text-gray-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">No revenue data found</p>
            <p className="mt-1 text-xs text-gray-400">Try adjusting the date range or filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111827" />
                  <stop offset="100%" stopColor="#374151" />
                </linearGradient>
                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b5563" />
                  <stop offset="100%" stopColor="#6b7280" />
                </linearGradient>
                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                }
                width={55}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              />
              <Bar dataKey="total" name="Total" fill="url(#gradTotal)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              <Bar dataKey="paid" name="Paid" fill="url(#gradPaid)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              <Bar dataKey="pending" name="Pending" fill="url(#gradPending)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default RevenueChart
