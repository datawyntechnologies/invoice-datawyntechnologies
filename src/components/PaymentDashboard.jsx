import { useState, useEffect, useRef } from 'react'
import { FiCheckCircle, FiClock, FiAlertCircle, FiDollarSign, FiCalendar, FiCreditCard, FiArrowUp, FiArrowDown, FiX, FiPlus, FiDownload, FiUpload, FiTrash2 } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import { paymentService } from '../services/paymentService'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'
import PaymentModal from './PaymentModal'
import { useAuth } from '../context/AuthContext'

const PaymentDashboard = ({ customerId }) => {
  const { hasPermission } = useAuth()
  const canViewPaymentHistory = hasPermission('customers.view_payment_history')
  const canImportData = hasPermission('data.import')
  const canExportData = hasPermission('data.export')
  const canDeletePayments = hasPermission('payment.edit')
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [deletingTransaction, setDeletingTransaction] = useState(false)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [paymentPlans, setPaymentPlans] = useState([])
  const [installments, setInstallments] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedInstallment, setSelectedInstallment] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)
  const [addPaymentForm, setAddPaymentForm] = useState({
    paymentName: '',
    paymentDate: '',
    amount: '',
    remainingAmount: '',
    paymentMethod: 'cash',
    notes: '',
  })

  useEffect(() => {
    fetchPaymentData()
  }, [customerId])

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      const [summaryRes, historyRes] = await Promise.all([
        paymentService.getCustomerPaymentSummary(customerId),
        paymentService.getPaymentHistory(customerId)
      ])

      // console.log('Customer ID:', customerId)
      // console.log('Payment Summary Response:', summaryRes)
      // console.log('Payment History Response:', historyRes)

      if (summaryRes && summaryRes.success) {
        // console.log('Summary data:', summaryRes.data)
        setSummary(summaryRes.data.summary)
        setPaymentPlans(summaryRes.data.paymentPlans || [])
        setInstallments(summaryRes.data.installments || [])
        // console.log('Payment Plans:', summaryRes.data.paymentPlans?.length || 0)
        // console.log('Installments:', summaryRes.data.installments?.length || 0)
      } else {
        console.error('Summary fetch failed or no data:', summaryRes)
        // Even if summary fails, try to set empty arrays
        setSummary(null)
        setPaymentPlans(summaryRes?.data?.paymentPlans || [])
        setInstallments(summaryRes?.data?.installments || [])
      }

      if (historyRes && historyRes.success) {
        setTransactions(historyRes.data || [])
      } else {
        console.error('History fetch failed:', historyRes)
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast.error('Failed to fetch payment data')
      setSummary(null)
      setPaymentPlans([])
      setInstallments([])
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setSelectedInstallment(null)
    fetchPaymentData()
    toast.success('Payment recorded successfully')
  }

  const openAddPaymentModal = () => {
    setAddPaymentForm({
      paymentName: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      remainingAmount: '',
      paymentMethod: 'cash',
      notes: '',
    })
    setShowAddPaymentModal(true)
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    if (!activeGroup) return

    const amount = parseFloat(addPaymentForm.amount)
    const remaining = addPaymentForm.remainingAmount === '' ? undefined : parseFloat(addPaymentForm.remainingAmount)
    if (!addPaymentForm.paymentDate || isNaN(amount) || amount <= 0) {
      toast.error('Payment date and a valid amount are required')
      return
    }
    if (remaining !== undefined && (isNaN(remaining) || remaining < 0 || remaining > amount)) {
      toast.error('Remaining amount must be between 0 and the amount')
      return
    }

    try {
      await paymentService.addManualInstallment({
        paymentPlanId: activeGroup.plan._id,
        paymentName: addPaymentForm.paymentName,
        paymentDate: addPaymentForm.paymentDate,
        scheduledAmount: amount,
        remainingAmount: remaining,
        paymentMethod: addPaymentForm.paymentMethod,
        notes: addPaymentForm.notes,
      })
      setShowAddPaymentModal(false)
      fetchPaymentData()
      toast.success('Payment added successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add payment')
    }
  }

  const handleExportSchedule = () => {
    if (!activeGroup) return
    try {
      const productNames = activeGroup.products.join(', ') || activeGroup.plan.invoiceNumber || ''
      const exportData = activeGroup.installments.map((installment) => ({
        'Invoice Number': activeGroup.plan.invoiceNumber || '',
        'Product': productNames,
        '#': installment.installmentNumber,
        'Payment Name': installment.paymentName || '',
        'Payment Date': installment.dueDate ? new Date(installment.dueDate).toISOString().split('T')[0] : '',
        'Amount': installment.scheduledAmount ?? '',
        'Paid': installment.amountPaid ?? '',
        'Remaining': installment.remainingAmount ?? '',
        'Status': installment.status || '',
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Schedule')
      const fileName = `payment-schedule-${(activeGroup.plan.invoiceNumber || 'export').replace(/[^a-zA-Z0-9-_]/g, '_')}-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      toast.success('Payment schedule exported successfully')
    } catch (error) {
      toast.error('Failed to export payment schedule')
    }
  }

  const handleImportClick = () => {
    setImportResult(null)
    setShowImportModal(true)
  }

  const handleScheduleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const response = await paymentService.importPaymentSchedule(file)
      if (response.success) {
        setImportResult(response.data)
        toast.success(response.message || 'Import completed')
        fetchPaymentData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import payment schedule')
    } finally {
      setImporting(false)
    }
  }

  const downloadScheduleImportTemplate = () => {
    const template = [
      {
        'Invoice Number': 'INV-2026-0001',
        'Product': 'E-Commerce (Dynamic)',
        'Payment Name': 'Manual Payment',
        'Payment Date': '2026-11-15',
        'Amount': 5000,
        'Remaining': 5000,
        'Payment Method': 'bank_transfer',
        'Notes': ''
      }
    ]
    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Schedule')
    XLSX.writeFile(workbook, 'payment-schedule-import-template.xlsx')
  }

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return
    setDeletingTransaction(true)
    try {
      const response = await paymentService.deleteTransaction(transactionToDelete._id)
      if (response.success) {
        toast.success('Payment transaction deleted')
        setTransactionToDelete(null)
        fetchPaymentData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payment transaction')
    } finally {
      setDeletingTransaction(false)
    }
  }

  const handleQuickMarkAsPaid = async (installment) => {
    if (!confirm(`Mark "${installment.paymentName}" as fully paid? Amount: ${formatCurrency(installment.remainingAmount)}`)) {
      return
    }

    try {
      await paymentService.recordPayment({
        installmentId: installment._id,
        amount: installment.remainingAmount,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        notes: 'Quick mark as paid'
      })
      fetchPaymentData()
      toast.success('Payment marked as paid')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as paid')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FiClock /> },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FiClock /> },
      paid: { bg: 'bg-green-100', text: 'text-green-800', icon: <FiCheckCircle /> },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: <FiAlertCircle /> }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getProgressPercentage = () => {
    if (!displaySummary || displaySummary.totalInvoiceAmount === 0) return 0
    return Math.round((displaySummary.totalPaid / displaySummary.totalInvoiceAmount) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (paymentPlans.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h3>
        <div className="text-center py-12">
          <FiDollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No payment plans found for this customer</p>
          <p className="text-xs text-gray-400 mt-1">Create a proforma invoice with a payment plan to get started</p>
        </div>
      </div>
    )
  }

  // Use summary if available, otherwise calculate from payment plans
  const displaySummary = summary || {
    totalInvoiceAmount: paymentPlans.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    totalPaid: paymentPlans.reduce((sum, p) => sum + (p.totalPaid || 0), 0),
    totalRemaining: paymentPlans.reduce((sum, p) => sum + (p.remainingAmount || 0), 0),
    pendingInstallments: installments.filter(inst => inst.status === 'pending').length,
    paidInstallments: installments.filter(inst => inst.status === 'paid').length,
    overdueInstallments: installments.filter(inst => inst.isOverdue).length,
    nextPayment: installments.find(inst => inst.status === 'pending' && !inst.isOverdue),
    progressPercentage: 0
  }

  const getProductName = (item) => item?.productSnapshot?.name || item?.productName || 'Product'
  const getPlanProducts = (plan) => plan.invoiceItems?.map(getProductName) || []
  const activePlanId = selectedPlanId && paymentPlans.some((plan) => plan._id === selectedPlanId)
    ? selectedPlanId
    : paymentPlans[0]?._id
  const groupedInstallments = paymentPlans.map((plan) => ({
    plan,
    products: getPlanProducts(plan),
    installments: installments.filter((installment) => installment.paymentPlan?.toString() === plan._id.toString()),
  }))
  const activeGroup = groupedInstallments.find(({ plan }) => plan._id === activePlanId)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Invoice Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(displaySummary.totalInvoiceAmount)}</p>
            </div>
            <FiDollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(displaySummary.totalPaid)}</p>
            </div>
            <FiArrowUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(displaySummary.totalRemaining)}</p>
            </div>
            <FiArrowDown className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</p>
            </div>
            <FiCreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Payment Progress</span>
          <span className="text-sm text-gray-600">{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>{formatCurrency(displaySummary.totalPaid)} Paid</span>
          <span>{formatCurrency(displaySummary.totalRemaining)} Remaining</span>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">Next Payment</p>
          <p className="text-lg font-bold text-gray-900">
            {displaySummary.nextPayment ? formatCurrency(displaySummary.nextPayment.scheduledAmount) : '-'}
          </p>
          {displaySummary.nextPayment && (
            <p className="text-xs text-gray-500">
              Due: {formatDate(displaySummary.nextPayment.dueDate)}
            </p>
          )}
        </div>

        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">Paid Installments</p>
          <p className="text-lg font-bold text-green-600">{displaySummary.paidInstallments}</p>
        </div>

        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">Pending Installments</p>
          <p className="text-lg font-bold text-yellow-600">{displaySummary.pendingInstallments}</p>
        </div>

        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-lg font-bold text-red-600">{displaySummary.overdueInstallments}</p>
        </div>
      </div>

      {/* Product Payment Schedules */}
      <div className="card">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-2 min-w-max px-2">
            {groupedInstallments.map(({ plan, products }) => (
              <button
                key={plan._id}
                onClick={() => setSelectedPlanId(plan._id)}
                className={`px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap ${
                  plan._id === activePlanId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="block">{products.join(', ') || plan.invoiceNumber || 'Payment Plan'}</span>
                <span className="block text-xs font-normal text-gray-500">{formatCurrency(plan.totalAmount)}</span>
              </button>
            ))}
          </nav>
        </div>

        {activeGroup && (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{activeGroup.products.join(', ') || activeGroup.plan.invoiceNumber || 'Payment Plan'}</h3>
                <p className="text-sm text-gray-500">
                  Invoice: {activeGroup.plan.invoiceNumber || '-'} · Paid: {formatCurrency(activeGroup.plan.totalPaid)} · Remaining: {formatCurrency(activeGroup.plan.remainingAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge">{activeGroup.plan.planType.replace(/_/g, ' ')}</span>
                {canExportData && (
                  <button
                    onClick={handleExportSchedule}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center gap-1"
                    title="Export this payment schedule"
                  >
                    <FiDownload size={14} />
                    Export
                  </button>
                )}
                {canImportData && (
                  <button
                    onClick={handleImportClick}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center gap-1"
                    title="Import payment schedule rows"
                  >
                    <FiUpload size={14} />
                    Import
                  </button>
                )}
                <button
                  onClick={openAddPaymentModal}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                >
                  <FiPlus size={14} />
                  Add Payment
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quick Mark</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeGroup.installments.map((installment) => (
                    <tr key={installment._id} className={installment.isOverdue ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{installment.installmentNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{installment.paymentName}</div>
                        {installment.isOverdue && <div className="text-xs text-red-600 font-medium">⚠ {installment.daysOverdue} days overdue</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(installment.dueDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(installment.scheduledAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.amountPaid)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(installment.remainingAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">{getStatusBadge(installment.status)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {installment.status !== 'paid' && (
                          <input
                            type="checkbox"
                            checked={installment.status === 'paid'}
                            onChange={(e) => {
                              if (e.target.checked) handleQuickMarkAsPaid(installment)
                            }}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {installment.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedInstallment(installment)
                              setShowPaymentModal(true)
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      {canViewPaymentHistory && (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        <div className="mt-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No payment history found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    {canDeletePayments && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => {
                    const plan = paymentPlans.find((item) => item._id === transaction.paymentPlan?._id || item._id === transaction.paymentPlan)
                    const products = getPlanProducts(plan || {})
                    return (
                      <tr key={transaction._id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(transaction.transactionDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{products.join(', ') || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{transaction.installment?.paymentName || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(transaction.amount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">{transaction.paymentMethod.replace('_', ' ')}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{transaction.referenceNumber || transaction.transactionId || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">{getStatusBadge(transaction.status)}</td>
                        {canDeletePayments && (
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => setTransactionToDelete(transaction)}
                              className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                              title="Delete transaction"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Import Payment Schedule Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Payment Schedule</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel (.xlsx) or CSV file. Each row must include an <strong>Invoice Number</strong> —
              rows are added as manual payment entries to that invoice's payment plan.
            </p>
            <button
              onClick={downloadScheduleImportTemplate}
              className="text-sm text-primary-600 hover:underline mb-4"
            >
              Download import template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleScheduleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiUpload size={18} />
              {importing ? 'Importing...' : 'Choose File & Import'}
            </button>

            {importResult && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-700">
                  {importResult.created} created, {importResult.failed} failed
                </p>
                {importResult.errors?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded border border-red-200 bg-red-50 p-3">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Payment Modal */}
      {showAddPaymentModal && activeGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Manual Payment</h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Adding to: <span className="font-medium text-gray-700">{activeGroup.products.join(', ') || activeGroup.plan.invoiceNumber || 'Payment Plan'}</span>
            </p>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Name (Optional)</label>
                <input
                  type="text"
                  value={addPaymentForm.paymentName}
                  onChange={(e) => setAddPaymentForm({ ...addPaymentForm, paymentName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Manual Payment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={addPaymentForm.paymentDate}
                  onChange={(e) => setAddPaymentForm({ ...addPaymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={addPaymentForm.amount}
                    onChange={(e) => setAddPaymentForm({ ...addPaymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remaining (₹)</label>
                  <input
                    type="number"
                    value={addPaymentForm.remainingAmount}
                    onChange={(e) => setAddPaymentForm({ ...addPaymentForm, remainingAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Same as amount"
                    min="0"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">Leave remaining empty if fully unpaid. If remaining is less than amount, the difference is recorded as paid.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={addPaymentForm.paymentMethod}
                  onChange={(e) => setAddPaymentForm({ ...addPaymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={addPaymentForm.notes}
                  onChange={(e) => setAddPaymentForm({ ...addPaymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="2"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Payment Transaction</h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete this payment transaction?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm">
              <p><span className="text-gray-500">Amount:</span> <span className="font-semibold">{formatCurrency(transactionToDelete.amount)}</span></p>
              <p><span className="text-gray-500">Date:</span> {formatDate(transactionToDelete.transactionDate)}</p>
              <p><span className="text-gray-500">Method:</span> <span className="capitalize">{(transactionToDelete.paymentMethod || '').replace('_', ' ')}</span></p>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              This will reverse the paid amount on the installment and payment plan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={deletingTransaction}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTransaction}
                disabled={deletingTransaction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deletingTransaction ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInstallment && (
        <PaymentModal
          installment={selectedInstallment}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedInstallment(null)
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default PaymentDashboard
