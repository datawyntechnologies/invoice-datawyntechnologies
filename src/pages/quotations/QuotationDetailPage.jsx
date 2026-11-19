import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiEdit, FiTrash2, FiCopy, FiDownload, FiArrowLeft, FiSend, FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { quotationService } from '../../services/quotationService'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS } from '../../config/constants'
import QuotationSendModal from '../../components/quotations/QuotationSendModal'

const QuotationDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchQuotation()
  }, [id])

  const fetchQuotation = async () => {
    setLoading(true)
    try {
      const response = await quotationService.getQuotation(id)
      if (response.success) {
        setQuotation(response.data)
      }
    } catch (error) {
      toast.error('Failed to fetch quotation')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await quotationService.deleteQuotation(id)
      if (response.success) {
        toast.success('Quotation deleted successfully')
        navigate('/quotations')
      }
    } catch (error) {
      toast.error('Failed to delete quotation')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await quotationService.duplicateQuotation(id)
      if (response.success) {
        toast.success('Quotation duplicated successfully')
        navigate(`/quotations/${response.data._id}/edit`)
      }
    } catch (error) {
      toast.error('Failed to duplicate quotation')
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await quotationService.downloadPDF(id)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      const client = quotation.customerSnapshot?.companyName?.replace(/[^a-zA-Z0-9]+/g, '_') || 'Client'
      link.setAttribute('download', `Datawyn_Quotation_${quotation.quotationNumber}_${client}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!selectedStatus) return toast.error('Select a status')
    try {
      const response = await quotationService.updateQuotationStatus(id, selectedStatus, statusNotes)
      if (response.success) {
        toast.success('Status updated successfully')
        fetchQuotation()
        setShowStatusModal(false)
        setSelectedStatus('')
        setStatusNotes('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const quickStatus = async (status) => {
    try {
      const response = await quotationService.updateQuotationStatus(id, status)
      if (response.success) {
        toast.success(`Quotation marked as ${QUOTATION_STATUS_LABELS[status]}`)
        fetchQuotation()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Quotation not found</p>
      </div>
    )
  }

  const customer = quotation.customerSnapshot || {}
  const address = quotation.billingAddress || customer.billingAddress
  const addressText = typeof address === 'string'
    ? address
    : [address?.street, address?.city, address?.state, address?.pincode].filter(Boolean).join(', ')
  const timeline = quotation.timeline || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/quotations')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quotation.quotationNumber}</h1>
            <p className="text-gray-600">{quotation.projectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge badge-${QUOTATION_STATUS_COLORS[quotation.status]}`}>
            {QUOTATION_STATUS_LABELS[quotation.status]}
          </span>
          <button onClick={() => setShowStatusModal(true)} className="btn btn-secondary text-sm">
            Change Status
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/quotations/${id}/edit`)} className="btn btn-secondary flex items-center gap-2">
          <FiEdit size={18} /> Edit
        </button>
        <button onClick={handleDuplicate} className="btn btn-secondary flex items-center gap-2">
          <FiCopy size={18} /> Duplicate
        </button>
        <button onClick={() => setShowSendModal(true)} className="btn btn-primary flex items-center gap-2">
          <FiSend size={18} /> Send Quotation
        </button>
        <button onClick={handleDownloadPDF} disabled={downloading} className="btn btn-secondary flex items-center gap-2">
          <FiDownload size={18} className={downloading ? 'animate-pulse' : ''} />
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
        {quotation.status !== 'accepted' && quotation.status !== 'rejected' && quotation.status !== 'expired' && (
          <>
            <button onClick={() => quickStatus('accepted')} className="btn btn-success flex items-center gap-2 text-sm">
              <FiCheck size={16} /> Mark Accepted
            </button>
            <button onClick={() => quickStatus('rejected')} className="btn btn-danger flex items-center gap-2 text-sm">
              <FiX size={16} /> Mark Rejected
            </button>
          </>
        )}
        <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger flex items-center gap-2">
          <FiTrash2 size={18} /> Delete
        </button>
      </div>

      {/* Quotation Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Quotation Date</label>
            <p className="text-gray-900">{formatDate(quotation.quotationDate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Valid Until</label>
            <p className="text-gray-900">{quotation.validUntil ? formatDate(quotation.validUntil) : 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Sent At</label>
            <p className="text-gray-900">{quotation.sentAt ? formatDateTime(quotation.sentAt) : '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Prepared By</label>
            <p className="text-gray-900">{quotation.preparedBy || quotation.createdBy?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Project Category</label>
            <p className="text-gray-900">{quotation.projectCategory || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Currency</label>
            <p className="text-gray-900">{quotation.currency || 'INR'}</p>
          </div>
          {quotation.projectDescription && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Project Description</label>
              <p className="text-gray-900 whitespace-pre-line">{quotation.projectDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
            <p className="text-gray-900">{customer.companyName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
            <p className="text-gray-900">{quotation.contactPerson || customer.contactPerson}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-gray-900">{quotation.email || customer.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            <p className="text-gray-900">{quotation.phone || customer.phone}</p>
          </div>
          {addressText && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Billing Address</label>
              <p className="text-gray-900">{addressText}</p>
            </div>
          )}
          {customer.gstin && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">GSTIN</label>
              <p className="text-gray-900">{customer.gstin}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scope of Work */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scope of Work</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Service / Product</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.items || []).map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="font-medium">{item.serviceName}</td>
                  <td className="text-sm text-gray-600">{item.description || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>
                    {item.discount > 0 ? (
                      <span className="text-red-600">
                        {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h2>
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
          </div>
          {quotation.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Discount{quotation.discountType === 'percentage' ? ` (${quotation.discountValue}%)` : ''}</span>
              <span className="font-medium text-red-600">-{formatCurrency(quotation.discountAmount)}</span>
            </div>
          )}
          {quotation.additionalCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Additional Charges</span>
              <span className="font-medium">{formatCurrency(quotation.additionalCharges)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Taxable Amount</span>
            <span className="font-medium">{formatCurrency(quotation.taxableAmount)}</span>
          </div>
          {quotation.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">GST ({quotation.taxRate}%)</span>
              <span className="font-medium">{formatCurrency(quotation.taxAmount)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span>{formatCurrency(quotation.grandTotal)}</span>
          </div>
          {quotation.amountInWords && (
            <div className="pt-2 text-sm text-gray-600">
              Amount in words: {quotation.amountInWords}
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      {quotation.paymentTerms && quotation.paymentTerms.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Stage</th><th>Description</th><th>Percentage</th><th>Due Date</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {quotation.paymentTerms.map((payment, index) => (
                  <tr key={index}>
                    <td className="font-medium">{payment.stage}</td>
                    <td className="text-sm text-gray-600">{payment.description || '-'}</td>
                    <td>{payment.percentage !== undefined && payment.percentage !== null ? `${payment.percentage}%` : '-'}</td>
                    <td>{payment.dueDate ? formatDate(payment.dueDate) : '-'}</td>
                    <td className="font-medium">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline */}
      {(timeline.estimatedStartDate || timeline.estimatedDuration || timeline.deliveryDate || (timeline.milestones || []).length > 0) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {timeline.estimatedStartDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Start</label>
                <p className="text-gray-900">{formatDate(timeline.estimatedStartDate)}</p>
              </div>
            )}
            {timeline.estimatedDuration && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
                <p className="text-gray-900">{timeline.estimatedDuration}</p>
              </div>
            )}
            {timeline.deliveryDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Date</label>
                <p className="text-gray-900">{formatDate(timeline.deliveryDate)}</p>
              </div>
            )}
          </div>
          {(timeline.milestones || []).length > 0 && (
            <div className="space-y-3">
              {timeline.milestones.map((milestone, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-gray-600 mt-1 text-sm">{milestone.description}</p>
                      )}
                    </div>
                    {milestone.expectedDate && (
                      <span className="text-sm text-gray-500">{formatDate(milestone.expectedDate)}</span>
                    )}
                  </div>
                  {milestone.duration && (
                    <p className="text-sm text-gray-500 mt-1">Duration: {milestone.duration}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inclusions / Exclusions */}
      {((quotation.inclusions || []).length > 0 || (quotation.exclusions || []).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(quotation.inclusions || []).length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Included Services</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {quotation.inclusions.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
          {(quotation.exclusions || []).length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Excluded Services</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {quotation.exclusions.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Terms & Notes */}
      {quotation.termsAndConditions && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
          <p className="text-gray-600 whitespace-pre-line">{quotation.termsAndConditions}</p>
        </div>
      )}
      {quotation.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-600 whitespace-pre-line">{quotation.notes}</p>
        </div>
      )}
      {quotation.internalRemarks && (
        <div className="card border-yellow-200 bg-yellow-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Remarks</h2>
          <p className="text-gray-700 whitespace-pre-line">{quotation.internalRemarks}</p>
          <p className="text-xs text-gray-500 mt-2">This section is never included in the client-facing PDF or emails.</p>
        </div>
      )}

      {/* Email History */}
      {(quotation.emailHistory || []).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email History</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Sent To</th><th>CC</th><th>Subject</th><th>Sent At</th></tr>
              </thead>
              <tbody>
                {quotation.emailHistory.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.to}</td>
                    <td>{entry.cc || '-'}</td>
                    <td className="text-sm">{entry.subject}</td>
                    <td>{entry.sentAt ? formatDateTime(entry.sentAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status History */}
      {(quotation.statusHistory || []).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
          <div className="space-y-2">
            {[...quotation.statusHistory].reverse().map((entry, index) => (
              <div key={index} className="flex items-center gap-3 text-sm border-b border-gray-100 pb-2">
                <span className={`badge badge-${QUOTATION_STATUS_COLORS[entry.status] || 'gray'}`}>
                  {QUOTATION_STATUS_LABELS[entry.status] || entry.status}
                </span>
                <span className="text-gray-500">{entry.changedAt ? formatDateTime(entry.changedAt) : ''}</span>
                {entry.notes && <span className="text-gray-600">— {entry.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <QuotationSendModal
          quotation={quotation}
          onClose={() => setShowSendModal(false)}
          onSent={fetchQuotation}
        />
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input">
                  <option value="">Select status</option>
                  {Object.entries(QUOTATION_STATUS_LABELS)
                    .filter(([key]) => key !== 'expired' || quotation.validUntil)
                    .map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} className="input h-20" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowStatusModal(false); setSelectedStatus(''); setStatusNotes('') }} className="btn btn-secondary">Cancel</button>
              <button onClick={handleStatusChange} className="btn btn-primary">Update Status</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Quotation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuotationDetailPage
