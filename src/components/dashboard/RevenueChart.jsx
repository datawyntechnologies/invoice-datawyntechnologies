import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FiCalendar } from 'react-icons/fi'
import { dashboardService } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/formatCurrency'

const GROUP_OPTIONS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' }
]

const RevenueChart = () => {
  const [data, setData] = useState([])
  const [totals, setTotals] = useState(null)
  const [groupBy, setGroupBy] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchRevenue = useCallback(async () => {
    setLoading(true)
    try {
      const response = await dashboardService.getRevenueChart({ startDate, endDate, groupBy })
      if (response.success) {
        setData(response.data.data || [])
        setTotals(response.data.totals || null)
      }
    } catch (error) {
      console.error('Failed to fetch revenue chart:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, groupBy])

  useEffect(() => {
    const timer = setTimeout(fetchRevenue, 300)
    return () => clearTimeout(timer)
  }, [fetchRevenue])

  const formatTooltipValue = (value) => formatCurrency(value)

  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
          <p className="text-sm text-gray-600">Total, paid and pending amounts over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input py-1.5 text-sm"
              title="Start date"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input py-1.5 text-sm"
              title="End date"
            />
          </div>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="input py-1.5 text-sm"
          >
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Paid Amount</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending Amount</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totals.pending)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No revenue data found for the selected filters</div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} width={90} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default RevenueChart
