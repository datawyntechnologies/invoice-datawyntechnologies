import { useEffect, useState } from 'react'
import { FiUsers, FiBox, FiFileText, FiTrendingUp, FiPlus, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/formatCurrency'
import StatCard from '../../components/dashboard/StatCard'
import RevenueChart from '../../components/dashboard/RevenueChart'
import { useAuth } from '../../context/AuthContext'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const canViewInvoiceValue = hasPermission('dashboard.view_invoice_value')
  const canViewPaidValue = hasPermission('dashboard.view_paid_value')
  const canViewPendingValue = hasPermission('dashboard.view_pending_value')
  const canViewRevenueChart = hasPermission('dashboard.view_revenue_chart')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-6 ${canViewInvoiceValue && canViewPaidValue && canViewPendingValue ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : (canViewInvoiceValue && canViewPaidValue) || (canViewInvoiceValue && canViewPendingValue) || (canViewPaidValue && canViewPendingValue) ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : canViewInvoiceValue || canViewPaidValue || canViewPendingValue ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={FiUsers}
          color="blue"
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={FiBox}
          color="green"
        />
        <StatCard
          title="Proforma Invoices"
          value={stats?.totalProformaInvoices || 0}
          icon={FiFileText}
          color="purple"
        />
        {canViewInvoiceValue && (
          <StatCard
            title="Total Invoice Value"
            value={formatCurrency(stats?.totalInvoiceValue || 0)}
            icon={FiTrendingUp}
            color="orange"
          />
        )}
        {canViewPaidValue && (
          <StatCard
            title="Total Invoice Paid Value"
            value={formatCurrency(stats?.totalPaidAmount || 0)}
            icon={FiCheckCircle}
            color="teal"
          />
        )}
        {canViewPendingValue && (
          <StatCard
            title="Total Invoice Pending Value"
            value={formatCurrency(stats?.totalPendingAmount || 0)}
            icon={FiClock}
            color="red"
          />
        )}
      </div>

      {/* Revenue Chart */}
      {canViewRevenueChart && <RevenueChart />}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/proforma/new')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <FiPlus size={20} />
            </div>
            <span className="font-medium">Create Proforma</span>
          </button>
          <button
            onClick={() => navigate('/customers/new')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <FiUsers size={20} />
            </div>
            <span className="font-medium">Add Customer</span>
          </button>
          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <FiBox size={20} />
            </div>
            <span className="font-medium">Add Product</span>
          </button>
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <FiFileText size={20} />
            </div>
            <span className="font-medium">View Invoices</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Proforma Invoices</h2>
        {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="font-medium">{invoice.invoiceNumber}</td>
                    <td>{invoice.customerSnapshot?.companyName}</td>
                    <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                    <td>{formatCurrency(invoice.grandTotal)}</td>
                    <td>
                      <span className={`badge badge-${invoice.status === 'draft' ? 'gray' : invoice.status === 'sent' ? 'blue' : invoice.status === 'accepted' ? 'green' : invoice.status === 'rejected' ? 'red' : 'orange'}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent invoices found</p>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
