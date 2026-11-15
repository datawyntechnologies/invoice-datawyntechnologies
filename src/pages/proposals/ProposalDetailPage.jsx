import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiEdit, FiTrash2, FiCopy, FiDownload, FiArrowLeft, FiSend } from 'react-icons/fi'
import { proposalService } from '../../services/proposalService'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '../../config/constants'
import ProposalSendModal from '../../components/proposals/ProposalSendModal'

const ProposalDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchProposal()
  }, [id])

  const fetchProposal = async () => {
    setLoading(true)
    try {
      const response = await proposalService.getProposal(id)
      if (response.success) {
        setProposal(response.data)
      }
    } catch (error) {
      toast.error('Failed to fetch proposal')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await proposalService.deleteProposal(id)
      if (response.success) {
        toast.success('Proposal deleted successfully')
        navigate('/proposals')
      }
    } catch (error) {
      toast.error('Failed to delete proposal')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await proposalService.duplicateProposal(id)
      if (response.success) {
        toast.success('Proposal duplicated successfully')
        navigate(`/proposals/${response.data._id}/edit`)
      }
    } catch (error) {
      toast.error('Failed to duplicate proposal')
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await proposalService.downloadPDF(id)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      const client = proposal.customerSnapshot?.companyName?.replace(/[^a-zA-Z0-9]+/g, '_') || 'Client'
      link.setAttribute('download', `Datawyn_Proposal_${proposal.proposalNumber}_${client}.pdf`)
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
    try {
      const response = await proposalService.updateProposalStatus(id, selectedStatus)
      if (response.success) {
        toast.success('Status updated successfully')
        fetchProposal()
        setShowStatusModal(false)
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Proposal not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/proposals')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{proposal.proposalNumber}</h1>
            <p className="text-gray-600">{proposal.projectTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge badge-${PROPOSAL_STATUS_COLORS[proposal.status]}`}>
            {PROPOSAL_STATUS_LABELS[proposal.status]}
          </span>
          <button
            onClick={() => setShowStatusModal(true)}
            className="btn btn-secondary text-sm"
          >
            Change Status
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate(`/proposals/${id}/edit`)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <FiEdit size={18} />
          Edit
        </button>
        <button
          onClick={handleDuplicate}
          className="btn btn-secondary flex items-center gap-2"
        >
          <FiCopy size={18} />
          Duplicate
        </button>
        <button
          onClick={() => setShowSendModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiSend size={18} />
          Send Proposal
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <FiDownload size={18} className={downloading ? 'animate-pulse' : ''} />
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn btn-danger flex items-center gap-2"
        >
          <FiTrash2 size={18} />
          Delete
        </button>
      </div>

      {/* Client Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
            <p className="text-gray-900">{proposal.customerSnapshot?.companyName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
            <p className="text-gray-900">{proposal.customerSnapshot?.contactPerson}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-gray-900">{proposal.customerSnapshot?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            <p className="text-gray-900">{proposal.customerSnapshot?.phone}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
            <p className="text-gray-900">
              {proposal.customerSnapshot?.billingAddress?.street}, {proposal.customerSnapshot?.billingAddress?.city}, {proposal.customerSnapshot?.billingAddress?.state} - {proposal.customerSnapshot?.billingAddress?.pincode}
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Details */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Proposal Date</label>
            <p className="text-gray-900">{formatDate(proposal.proposalDate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Valid Until</label>
            <p className="text-gray-900">{proposal.validUntil ? formatDate(proposal.validUntil) : 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Prepared By</label>
            <p className="text-gray-900">{proposal.preparedBy}</p>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-500 mb-1">Project Title</label>
            <p className="text-gray-900">{proposal.projectTitle}</p>
          </div>
          {proposal.projectSubtitle && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Project Subtitle</label>
              <p className="text-gray-900">{proposal.projectSubtitle}</p>
            </div>
          )}
          {proposal.projectDescription && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Project Description</label>
              <p className="text-gray-900 whitespace-pre-line">{proposal.projectDescription}</p>
            </div>
          )}
          {proposal.objectives && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Project Objectives</label>
              <p className="text-gray-900 whitespace-pre-line">{proposal.objectives}</p>
            </div>
          )}
          {proposal.proposedSolution && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Proposed Solution</label>
              <p className="text-gray-900 whitespace-pre-line">{proposal.proposedSolution}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scope of Work */}
      {proposal.scopeOfWork && proposal.scopeOfWork.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scope of Work</h2>
          <div className="space-y-4">
            {proposal.scopeOfWork.map((item, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                {item.description && (
                  <p className="text-gray-600 mt-1">{item.description}</p>
                )}
                {item.bulletPoints && item.bulletPoints.length > 0 && (
                  <ul className="list-disc list-inside mt-2 text-gray-600">
                    {item.bulletPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverables */}
      {proposal.deliverables && proposal.deliverables.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h2>
          <div className="space-y-4">
            {proposal.deliverables.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-600 mt-1">{item.description}</p>
                    )}
                    {item.notes && (
                      <p className="text-gray-500 mt-1 text-sm">{item.notes}</p>
                    )}
                  </div>
                  {item.quantity && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                      Qty: {item.quantity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technology Stack */}
      {proposal.technologyStack && proposal.technologyStack.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technology Stack</h2>
          <div className="flex flex-wrap gap-2">
            {proposal.technologyStack.map((tech, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {proposal.timeline && (proposal.timeline.startDate || proposal.timeline.estimatedCompletionDate || proposal.timeline.milestones?.length > 0) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {proposal.timeline.startDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <p className="text-gray-900">{formatDate(proposal.timeline.startDate)}</p>
              </div>
            )}
            {proposal.timeline.estimatedCompletionDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Completion</label>
                <p className="text-gray-900">{formatDate(proposal.timeline.estimatedCompletionDate)}</p>
              </div>
            )}
            {proposal.timeline.duration && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
                <p className="text-gray-900">{proposal.timeline.duration}</p>
              </div>
            )}
          </div>
          {proposal.timeline.milestones && proposal.timeline.milestones.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Milestones</h3>
              <div className="space-y-3">
                {proposal.timeline.milestones.map((milestone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-gray-600 mt-1">{milestone.description}</p>
                        )}
                      </div>
                      {milestone.expectedDate && (
                        <span className="text-sm text-gray-500">
                          {formatDate(milestone.expectedDate)}
                        </span>
                      )}
                    </div>
                    {milestone.duration && (
                      <p className="text-sm text-gray-500 mt-1">Duration: {milestone.duration}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {proposal.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div>
                      <p className="font-medium">{item.isCustom ? item.customName : item.productSnapshot?.name}</p>
                      {item.customDescription && (
                        <p className="text-sm text-gray-500">{item.customDescription}</p>
                      )}
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.rate)}</td>
                  <td>
                    {item.discount > 0 ? (
                      <span className="text-red-600">
                        {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{item.gstRate}%</td>
                  <td className="font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="max-w-md ml-auto space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-red-600">-{formatCurrency(proposal.itemDiscount + proposal.invoiceDiscount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxable Amount</span>
            <span className="font-medium">{formatCurrency(proposal.taxableAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">CGST</span>
            <span className="font-medium">{formatCurrency(proposal.cgst)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">SGST</span>
            <span className="font-medium">{formatCurrency(proposal.sgst)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IGST</span>
            <span className="font-medium">{formatCurrency(proposal.igst)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Tax</span>
            <span className="font-medium">{formatCurrency(proposal.totalTax)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span>{formatCurrency(proposal.grandTotal)}</span>
          </div>
          {proposal.amountInWords && (
            <div className="pt-2 text-sm text-gray-600">
              Amount in words: {proposal.amountInWords}
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
            <p className="text-gray-900">{proposal.paymentTerms}</p>
          </div>
          {proposal.advanceAmount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Advance Amount</label>
              <p className="text-gray-900">{formatCurrency(proposal.advanceAmount)}</p>
            </div>
          )}
          {proposal.balanceAmount && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Balance Amount</label>
              <p className="text-gray-900">{formatCurrency(proposal.balanceAmount)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      {proposal.termsAndConditions && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
          <p className="text-gray-600 whitespace-pre-line">{proposal.termsAndConditions}</p>
        </div>
      )}

      {/* Notes */}
      {proposal.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <p className="text-gray-600 whitespace-pre-line">{proposal.notes}</p>
        </div>
      )}

      {/* Payment Schedule */}
      {proposal.paymentSchedule && proposal.paymentSchedule.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Stage</th><th>Due Date</th><th>Percentage</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {proposal.paymentSchedule.map((payment, index) => (
                  <tr key={index}>
                    <td>{payment.stage || '—'}</td>
                    <td>{payment.dueDate ? formatDate(payment.dueDate) : '—'}</td>
                    <td>{payment.percentage || 0}%</td>
                    <td>{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client Decision */}
      {proposal.clientDecision && (proposal.clientDecision.acceptedAt || proposal.clientDecision.rejectedAt || proposal.clientDecision.changesRequestedAt) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Response</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {proposal.clientDecision.acceptedAt && <div><span className="text-gray-500">Accepted:</span> {formatDate(proposal.clientDecision.acceptedAt)} by {proposal.clientDecision.acceptedBy || 'Client'}</div>}
            {proposal.clientDecision.rejectedAt && <div><span className="text-gray-500">Rejected:</span> {formatDate(proposal.clientDecision.rejectedAt)}</div>}
            {proposal.clientDecision.changesRequestedAt && <div><span className="text-gray-500">Changes requested:</span> {formatDate(proposal.clientDecision.changesRequestedAt)} by {proposal.clientDecision.changesRequestedBy || 'Client'}</div>}
            {proposal.clientDecision.changeRequest && <div className="md:col-span-3"><span className="text-gray-500">Request:</span> {proposal.clientDecision.changeRequest}</div>}
          </div>
        </div>
      )}

      {/* Activity History */}
      {proposal.statusHistory && proposal.statusHistory.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h2>
          <div className="space-y-3">
            {[...proposal.statusHistory].reverse().map((entry, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <span className={`badge badge-${PROPOSAL_STATUS_COLORS[entry.status] || 'gray'}`}>{PROPOSAL_STATUS_LABELS[entry.status] || entry.status}</span>
                <div>
                  <p className="text-gray-900">{formatDate(entry.changedAt)}</p>
                  {entry.notes && <p className="text-gray-500">{entry.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Notes */}
      {proposal.internalNotes && (
        <div className="card bg-yellow-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
          <p className="text-gray-600 whitespace-pre-line">{proposal.internalNotes}</p>
        </div>
      )}

      {showSendModal && (
        <ProposalSendModal
          proposal={proposal}
          onClose={() => setShowSendModal(false)}
          onSent={fetchProposal}
        />
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Status</h3>
            <div className="space-y-2">
              {Object.entries(PROPOSAL_STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedStatus(key)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedStatus === key
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus}
                className="btn btn-primary"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Proposal</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this proposal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProposalDetailPage