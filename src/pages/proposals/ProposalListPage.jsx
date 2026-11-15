import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiCopy, FiDownload, FiSend } from 'react-icons/fi'
import ProposalSendModal from '../../components/proposals/ProposalSendModal'
import { proposalService } from '../../services/proposalService'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '../../config/constants'
import Pagination from '../../components/common/Pagination'

const ProposalListPage = () => {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [sendProposal, setSendProposal] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchProposals()
  }, [currentPage, debouncedSearchTerm, statusFilter])

  const fetchProposals = async () => {
    setLoading(true)
    try {
      const response = await proposalService.getProposals({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter
      })
      if (response.success) {
        setProposals(response.data.items || response.data)
        setTotalPages(response.data.pagination?.pages || 1)
        setTotalItems(response.data.pagination?.total || 0)
      }
    } catch (error) {
      toast.error('Failed to fetch proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await proposalService.deleteProposal(id)
      if (response.success) {
        toast.success('Proposal deleted successfully')
        setCurrentPage(1)
        fetchProposals()
      }
    } catch (error) {
      toast.error('Failed to delete proposal')
    } finally {
      setShowDeleteModal(null)
    }
  }

  const handleDuplicate = async (id) => {
    try {
      const response = await proposalService.duplicateProposal(id)
      if (response.success) {
        toast.success('Proposal duplicated successfully')
        fetchProposals()
      }
    } catch (error) {
      toast.error('Failed to duplicate proposal')
    }
  }

  const handleDownloadPDF = async (proposal) => {
    setDownloadingId(proposal._id)
    try {
      const response = await proposalService.downloadPDF(proposal._id)
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
      setDownloadingId(null)
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600">Manage your proposals</p>
        </div>
        <button
          onClick={() => navigate('/proposals/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Create Proposal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-48"
        >
          <option value="">All Status</option>
          {Object.entries(PROPOSAL_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Proposal Number</th>
              <th>Client</th>
              <th>Project</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length > 0 ? (
              proposals.map((proposal) => (
                <tr key={proposal._id}>
                  <td className="font-medium">{proposal.proposalNumber}</td>
                  <td>{proposal.customerSnapshot?.companyName}</td>
                  <td>{proposal.projectTitle}</td>
                  <td>{formatDate(proposal.proposalDate)}</td>
                  <td>{formatCurrency(proposal.grandTotal)}</td>
                  <td>
                    <span className={`badge badge-${PROPOSAL_STATUS_COLORS[proposal.status]}`}>
                      {PROPOSAL_STATUS_LABELS[proposal.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/proposals/${proposal._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="View"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/proposals/${proposal._id}/edit`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(proposal._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Duplicate"
                      >
                        <FiCopy size={18} />
                      </button>
                      <button
                        onClick={() => setSendProposal(proposal)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Send Proposal"
                      >
                        <FiSend size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(proposal)}
                        disabled={downloadingId === proposal._id}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-50"
                        title="Download PDF"
                      >
                        <FiDownload size={18} className={downloadingId === proposal._id ? 'animate-pulse' : ''} />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(proposal._id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No proposals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {sendProposal && (
        <ProposalSendModal
          proposal={sendProposal}
          onClose={() => setSendProposal(null)}
          onSent={fetchProposals}
        />
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
                onClick={() => setShowDeleteModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
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

export default ProposalListPage