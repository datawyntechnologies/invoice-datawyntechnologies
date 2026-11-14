import { useState, useEffect } from 'react'
import { FiDollarSign, FiCalendar, FiCheckCircle, FiClock, FiAlertCircle, FiEye, FiTrash2, FiX } from 'react-icons/fi'
import { paymentService } from '../../services/paymentService'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'
import StatCard from '../../components/dashboard/StatCard'

const PaymentListPage = () => {
  const [loading, setLoading] = useState(true)
  const [paymentPlans, setPaymentPlans] = useState([])
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
    activePlans: 0
  })
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchPaymentPlans()
  }, [])

  const fetchPaymentPlans = async () => {
    setLoading(true)
    try {
      const response = await paymentService.getAllPaymentPlans()
      if (response.success) {
        setPaymentPlans(response.data.paymentPlans || [])
        setStats(response.data.stats || stats)
      }
    } catch (error) {
      toast.error('Failed to fetch payment plans')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (plan) => {
    setSelectedPlan(plan)
    setShowViewModal(true)
    setLoadingDetails(true)

    try {
      const response = await paymentService.getPaymentPlanByInvoice(plan.invoiceType, plan.invoiceId)
      if (response.success) {
        setSelectedPlanDetails(response.data)
      }
    } catch (error) {
      toast.error('Failed to fetch payment plan details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleDelete = (plan) => {
    setSelectedPlan(plan)
    setShowDeleteModal(true)
  }

  const handleForceDelete = (plan) => {
    setSelectedPlan(plan)
    setShowForceDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedPlan) return

    try {
      const response = await paymentService.deletePaymentPlan(selectedPlan._id)
      if (response.success) {
        toast.success('Payment plan deleted successfully')
        setShowDeleteModal(false)
        setSelectedPlan(null)
        fetchPaymentPlans()
      } else {
        toast.error(response.message || 'Failed to delete payment plan')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete payment plan'
      toast.error(errorMessage)
    }
  }

  const confirmForceDelete = async () => {
    if (!selectedPlan) return

    try {
      const response = await paymentService.deletePaymentPlan(selectedPlan._id, true)
      if (response.success) {
        toast.success('Payment plan deleted successfully')
        setShowForceDeleteModal(false)
        setSelectedPlan(null)
        fetchPaymentPlans()
      } else {
        toast.error(response.message || 'Failed to delete payment plan')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete payment plan'
      toast.error(errorMessage)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FiCheckCircle className="text-green-600" />
      case 'completed':
        return <FiCheckCircle className="text-green-600" />
      case 'pending':
        return <FiClock className="text-yellow-600" />
      case 'overdue':
        return <FiAlertCircle className="text-red-600" />
      default:
        return <FiClock className="text-gray-400" />
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
        <h1 className="text-2xl font-bold text-gray-900">Payment Plans</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          icon={FiDollarSign}
          color="blue"
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(stats.totalPaid)}
          icon={FiCheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(stats.totalPending)}
          icon={FiClock}
          color="orange"
        />
        <StatCard
          title="Active Plans"
          value={stats.activePlans}
          icon={FiCalendar}
          color="purple"
        />
      </div>

      {/* Payment Plans Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Payment Plans</h2>
        {paymentPlans.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Plan Type</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentPlans.map((plan) => (
                  <tr key={plan._id}>
                    <td className="font-medium">{plan.invoiceNumber}</td>
                    <td>{plan.customer?.companyName || plan.customer?.name || '-'}</td>
                    <td className="capitalize">{plan.planType.replace('_', ' ')}</td>
                    <td>{formatCurrency(plan.totalAmount)}</td>
                    <td>{formatCurrency(plan.totalPaid)}</td>
                    <td>{formatCurrency(plan.remainingAmount)}</td>
                    <td>
                      <span className={`badge badge-${plan.status === 'active' ? 'green' : plan.status === 'completed' ? 'blue' : 'gray'}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td>{formatDate(plan.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(plan)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                        {plan.totalPaid === 0 ? (
                          <button
                            onClick={() => handleDelete(plan)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleForceDelete(plan)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Force Delete (has payments)"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No payment plans found</p>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Payment Plan Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedPlan(null)
                  setSelectedPlanDetails(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : selectedPlanDetails ? (
                <div className="space-y-6">
                  {/* Plan Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Invoice Number</p>
                      <p className="font-medium text-gray-900">{selectedPlan.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium text-gray-900">{selectedPlan.customer?.companyName || selectedPlan.customer?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Plan Type</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedPlan.planType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`badge badge-${selectedPlan.status === 'active' ? 'green' : selectedPlan.status === 'completed' ? 'blue' : 'gray'}`}>
                        {selectedPlan.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedPlan.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Paid</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedPlan.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedPlan.remainingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created Date</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedPlan.createdAt)}</p>
                    </div>
                  </div>

                  {/* Installments */}
                  {selectedPlanDetails.installments && selectedPlanDetails.installments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h3>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Installment</th>
                              <th>Payment Name</th>
                              <th>Amount</th>
                              <th>Paid</th>
                              <th>Remaining</th>
                              <th>Due Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPlanDetails.installments.map((installment, index) => (
                              <tr key={installment._id}>
                                <td className="font-medium">{index + 1}</td>
                                <td>{installment.paymentName}</td>
                                <td>{formatCurrency(installment.scheduledAmount)}</td>
                                <td>{formatCurrency(installment.amountPaid)}</td>
                                <td>{formatCurrency(installment.remainingAmount)}</td>
                                <td>{formatDate(installment.dueDate)}</td>
                                <td>
                                  <span className={`badge badge-${installment.status === 'paid' ? 'green' : installment.status === 'partial' ? 'yellow' : installment.status === 'overdue' ? 'red' : 'gray'}`}>
                                    {installment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Delete Payment Plan</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedPlan(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete the payment plan for invoice <strong>{selectedPlan.invoiceNumber}</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone. All associated installments and payment records will be deleted.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedPlan(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force Delete Confirmation Modal */}
      {showForceDeleteModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">⚠️ Force Delete Payment Plan</h2>
              <button
                onClick={() => {
                  setShowForceDeleteModal(false)
                  setSelectedPlan(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800 font-medium mb-2">Warning: This payment plan has payments recorded!</p>
                <p className="text-sm text-orange-700">
                  Invoice: <strong>{selectedPlan.invoiceNumber}</strong><br />
                  Amount Paid: <strong>{formatCurrency(selectedPlan.totalPaid)}</strong><br />
                  Remaining: <strong>{formatCurrency(selectedPlan.remainingAmount)}</strong>
                </p>
              </div>
              <p className="text-gray-600">
                Force deleting this payment plan will:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Delete all payment transactions</li>
                <li>Delete all payment installments</li>
                <li>Remove the payment plan from the invoice</li>
                <li>This action cannot be undone</li>
              </ul>
              <p className="text-sm text-red-600 font-medium">
                This is a destructive action. Only proceed if you are absolutely certain.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowForceDeleteModal(false)
                    setSelectedPlan(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmForceDelete}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Force Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentListPage
