import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiDownload, FiUpload } from 'react-icons/fi'
import { customerService } from '../../services/customerService'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/dateUtils'
import Pagination from '../../components/common/Pagination'
import * as XLSX from 'xlsx'

const CustomerListPage = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)
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
    fetchCustomers()
  }, [currentPage, debouncedSearchTerm])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const response = await customerService.getCustomers({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      })
      if (response.success) {
        setCustomers(response.data.items || response.data)
        setTotalPages(response.data.pagination?.pages || 1)
        setTotalItems(response.data.pagination?.total || 0)
      }
    } catch (error) {
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await customerService.getCustomers({ page: 1, limit: 10000 })
      if (!response.success) return

      const items = response.data.items || response.data
      const exportData = items.map(customer => ({
        'Company Name': customer.companyName || '',
        'Contact Person': customer.contactPerson || '',
        'Email': customer.email || '',
        'Phone': customer.phone || '',
        'Alternate Phone': customer.alternatePhone || '',
        'Customer Type': customer.customerType || '',
        'Notes': customer.notes || '',
        'Billing Street': customer.billingAddress?.street || '',
        'Billing City': customer.billingAddress?.city || '',
        'Billing State': customer.billingAddress?.state || '',
        'Billing Pincode': customer.billingAddress?.pincode || '',
        'Shipping Street': customer.shippingAddress?.street || '',
        'Shipping City': customer.shippingAddress?.city || '',
        'Shipping State': customer.shippingAddress?.state || '',
        'Shipping Pincode': customer.shippingAddress?.pincode || ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')
      XLSX.writeFile(workbook, `customers-export-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Customers exported successfully')
    } catch (error) {
      toast.error('Failed to export customers')
    }
  }

  const handleImportClick = () => {
    setImportResult(null)
    setShowImportModal(true)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const response = await customerService.importCustomers(file)
      if (response.success) {
        setImportResult(response.data)
        toast.success(response.message || 'Import completed')
        setCurrentPage(1)
        fetchCustomers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import customers')
    } finally {
      setImporting(false)
    }
  }

  const downloadImportTemplate = () => {
    const template = [
      {
        'Company Name': 'Acme Corp',
        'Contact Person': 'John Doe',
        'Email': 'john@acme.com',
        'Phone': '9876543210',
        'Alternate Phone': '',
        'Customer Type': 'business',
        'Notes': '',
        'Billing Street': '123 Main St',
        'Billing City': 'Mumbai',
        'Billing State': 'Maharashtra',
        'Billing Pincode': '400001',
        'Shipping Street': '',
        'Shipping City': '',
        'Shipping State': '',
        'Shipping Pincode': ''
      }
    ]
    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')
    XLSX.writeFile(workbook, 'customers-import-template.xlsx')
  }

  const handleDelete = async (id) => {
    try {
      const response = await customerService.deleteCustomer(id)
      if (response.success) {
        toast.success('Customer deleted successfully')
        setCurrentPage(1)
        fetchCustomers()
      }
    } catch (error) {
      toast.error('Failed to delete customer')
    } finally {
      setShowDeleteModal(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiDownload size={18} />
            Export
          </button>
          <button
            onClick={handleImportClick}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiUpload size={18} />
            Import
          </button>
          <button
            onClick={() => navigate('/customers/new')}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlus size={20} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="font-medium">{customer.companyName}</td>
                  <td>{customer.contactPerson || '-'}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>
                    <span className="capitalize">{customer.customerType}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/customers/${customer._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="View"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/customers/${customer._id}/edit`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(customer._id)}
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
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No customers found
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Customers</h3>
            <p className="text-gray-600 mb-4">
              Upload an Excel (.xlsx) or CSV file. Rows matching an existing customer by email or company name
              will update that customer; other rows will create a new customer.
            </p>
            <button
              onClick={downloadImportTemplate}
              className="text-sm text-primary-600 hover:underline mb-4"
            >
              Download import template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <FiUpload size={18} />
              {importing ? 'Importing...' : 'Choose File & Import'}
            </button>

            {importResult && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-700">
                  {importResult.created} created, {importResult.updated} updated, {importResult.failed} failed
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
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Customer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this customer? This action cannot be undone.
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

export default CustomerListPage
