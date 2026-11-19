import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiCopy, FiDownload, FiSend, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { quotationService } from '../../services/quotationService'
import { customerService } from '../../services/customerService'
import { formatDate } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS } from '../../config/constants'
import Pagination from '../../components/common/Pagination'
import QuotationSendModal from '../../components/quotations/QuotationSendModal'

const STAT_CARDS = [
  { key: 'totalQuotations', label: 'Total Quotations', color: 'text-gray-900' },
  { key: 'draft', label: 'Draft', color: 'text-gray-600' },
  { key: 'sent', label: 'Sent', color: 'text-blue-600' },
  { key: 'accepted', label: 'Accepted', color: 'text-green-600' },
  { key: 'rejected', label: 'Rejected', color: 'text-red-600' },
  { key: 'expired', label: 'Expired', color: 'text-orange-600' }
]

const QuotationListPage = () => {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState([])
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [sendQuotation, setSendQuotation] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerService.getCustomers({ limit: 500 })
        const items = response.data?.items || response.data || []
        setCustomers(Array.isArray(items) ? items : [])
      } catch { /* non-blocking */ }
    }
    loadCustomers()
  }, [])

  useEffect(() => {
    fetchQuotations()
    fetchStats()
  }, [currentPage, debouncedSearchTerm, statusFilter, customerFilter, dateFrom, dateTo, sortBy, sortOrder])

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const response = await quotationService.getQuotations({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter,
        customer: customerFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortOrder
      })
      if (response.success) {
        setQuotations(response.data.items || [])
        setTotalPages(response.data.pagination?.pages || 1)
        setTotalItems(response.data.pagination?.total || 0)
      }
    } catch (error) {
      toast.error('Failed to fetch quotations')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await quotationService.getQuotationStats()
      if (response.success) setStats(response.data)
    } catch { /* non-blocking */ }
  }

  const handleDelete = async (id) => {
    try {
      const response = await quotationService.deleteQuotation(id)
      if (response.success) {
        toast.success('Quotation deleted successfully')
        setCurrentPage(1)
        fetchQuotations()
        fetchStats()
      }
    } catch (error) {
      toast.error('Failed to delete quotation')
    } finally {
      setShowDeleteModal(null)
    }
  }

  const handleDuplicate = async (id) => {
    try {
      const response = await quotationService.duplicateQuotation(id)
      if (response.success) {
        toast.success('Quotation duplicated successfully')
        fetchQuotations()
        fetchStats()
      }
    } catch (error) {
      toast.error('Failed to duplicate quotation')
    }
  }

  const handleDownloadPDF = async (quotation) => {
    setDownloadingId(quotation._id)
    try {
      const response = await quotationService.downloadPDF(quotation._id)
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
      setDownloadingId(null)
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <FiArrowUp size={12} className="inline ml-1" /> : <FiArrowDown size={12} className="inline ml-1" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Manage your quotations</p>
        </div>
        <button
          onClick={() => navigate('/quotations/new')}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Create Quotation
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {STAT_CARDS.map(card => (
            <div key={card.key} className="card !p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{stats[card.key] ?? 0}</p>
            </div>
          ))}
          <div className="card !p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Quoted</p>
            <p className="text-xl font-bold mt-1 text-gray-900">{formatCurrency(stats.totalQuotedAmount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="input sm:w-44">
          <option value="">All Status</option>
          {Object.entries(QUOTATION_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={customerFilter} onChange={(e) => { setCustomerFilter(e.target.value); setCurrentPage(1) }} className="input sm:w-52">
          <option value="">All Clients</option>
          {customers.map(c => (
            <option key={c._id} value={c._id}>{c.companyName}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }} className="input sm:w-40" title="From date" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }} className="input sm:w-40" title="To date" />
      </div>

      {/* Table */}
      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => handleSort('quotationNumber')}>Quotation No <SortIcon field="quotationNumber" /></th>
              <th>Client</th>
              <th className="cursor-pointer" onClick={() => handleSort('projectName')}>Project <SortIcon field="projectName" /></th>
              <th className="cursor-pointer" onClick={() => handleSort('quotationDate')}>Date <SortIcon field="quotationDate" /></th>
              <th className="cursor-pointer" onClick={() => handleSort('validUntil')}>Valid Until <SortIcon field="validUntil" /></th>
              <th className="cursor-pointer" onClick={() => handleSort('grandTotal')}>Total <SortIcon field="grandTotal" /></th>
              <th>Status</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length > 0 ? (
              quotations.map((quotation) => (
                <tr key={quotation._id}>
                  <td className="font-medium">{quotation.quotationNumber}</td>
                  <td>{quotation.customerSnapshot?.companyName || quotation.customer?.companyName}</td>
                  <td>{quotation.projectName}</td>
                  <td>{formatDate(quotation.quotationDate)}</td>
                  <td>{quotation.validUntil ? formatDate(quotation.validUntil) : '-'}</td>
                  <td>{formatCurrency(quotation.grandTotal)}</td>
                  <td>
                    <span className={`badge badge-${QUOTATION_STATUS_COLORS[quotation.status]}`}>
                      {QUOTATION_STATUS_LABELS[quotation.status]}
                    </span>
                  </td>
                  <td>{quotation.createdBy?.name || '-'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/quotations/${quotation._id}`)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600" title="View"><FiEye size={16} /></button>
                      <button onClick={() => navigate(`/quotations/${quotation._id}/edit`)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit"><FiEdit size={16} /></button>
                      <button onClick={() => handleDownloadPDF(quotation)} disabled={downloadingId === quotation._id} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-50" title="Download PDF"><FiDownload size={16} className={downloadingId === quotation._id ? 'animate-pulse' : ''} /></button>
                      <button onClick={() => setSendQuotation(quotation)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600" title="Send Email"><FiSend size={16} /></button>
                      <button onClick={() => handleDuplicate(quotation._id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600" title="Duplicate"><FiCopy size={16} /></button>
                      <button onClick={() => setShowDeleteModal(quotation._id)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600" title="Delete"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">
                  {loading ? 'Loading...' : 'No quotations found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {sendQuotation && (
        <QuotationSendModal
          quotation={sendQuotation}
          onClose={() => setSendQuotation(null)}
          onSent={() => { fetchQuotations(); fetchStats() }}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Quotation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(showDeleteModal)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuotationListPage
