import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye, FiDownload, FiUpload } from 'react-icons/fi'
import { productService } from '../../services/productService'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/formatCurrency'
import Pagination from '../../components/common/Pagination'
import { useAuth } from '../../context/AuthContext'
import * as XLSX from 'xlsx'

const ProductListPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canImportData = hasPermission('data.import')
  const canExportData = hasPermission('data.export')
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
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

  // Debounce search term for server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Client-side filtering for instant feedback
  useEffect(() => {
    if (searchTerm) {
      const filtered = allProducts.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setProducts(filtered)
    } else {
      setProducts(allProducts)
    }
  }, [searchTerm, allProducts])

  useEffect(() => {
    fetchProducts()
  }, [currentPage, debouncedSearchTerm])

  const fetchProducts = async () => {
    if (debouncedSearchTerm) {
      setLoading(true)
    }
    try {
      const response = await productService.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm
      })
      if (response.success) {
        const fetchedProducts = response.data.items || response.data
        setProducts(fetchedProducts)
        setAllProducts(fetchedProducts)
        setTotalPages(response.data.pagination?.pages || 1)
        setTotalItems(response.data.pagination?.total || 0)
      }
    } catch (error) {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await productService.getProducts({ page: 1, limit: 10000 })
      if (!response.success) return

      const items = response.data.items || response.data
      const exportData = items.map(product => ({
        'Code': product.code || '',
        'Name': product.name || '',
        'Type': product.productType === 'combo' ? 'combo' : 'individual',
        'Description': product.description || '',
        'Basic Price': product.priceRanges?.basic ?? '',
        'Standard Price': product.priceRanges?.standard ?? product.price ?? '',
        'Premium Price': product.priceRanges?.premium ?? '',
        'Custom Price': product.priceRanges?.custom ?? '',
        'Status': product.status || 'active'
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
      XLSX.writeFile(workbook, `products-export-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Products exported successfully')
    } catch (error) {
      toast.error('Failed to export products')
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
      const response = await productService.importProducts(file)
      if (response.success) {
        setImportResult(response.data)
        toast.success(response.message || 'Import completed')
        setCurrentPage(1)
        fetchProducts()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import products')
    } finally {
      setImporting(false)
    }
  }

  const downloadImportTemplate = () => {
    const template = [
      {
        'Code': 'PROD-2026-0001',
        'Name': 'Sample Product',
        'Type': 'individual',
        'Description': 'Sample description',
        'Basic Price': 100,
        'Standard Price': 150,
        'Premium Price': 200,
        'Custom Price': '',
        'Status': 'active'
      }
    ]
    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
    XLSX.writeFile(workbook, 'products-import-template.xlsx')
  }

  const handleDelete = async (id) => {
    try {
      const response = await productService.deleteProduct(id)
      if (response.success) {
        toast.success('Product deleted successfully')
        setCurrentPage(1)
        fetchProducts()
      }
    } catch (error) {
      toast.error('Failed to delete product')
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
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-600">Manage your products and services</p>
        </div>
        <div className="flex items-center gap-2">
          {canExportData && (
            <button
              onClick={handleExport}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FiDownload size={18} />
              Export
            </button>
          )}
          {canImportData && (
            <button
              onClick={handleImportClick}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FiUpload size={18} />
              Import
            </button>
          )}
          <button
            onClick={() => navigate('/products/new')}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search products..."
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
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product._id}>
                  <td className="font-medium">{product.code || '-'}</td>
                  <td>{product.name}</td>
                  <td>
                    <span className={`badge ${product.productType === 'combo' ? 'badge-purple' : 'badge-blue'}`}>
                      {product.productType === 'combo' ? 'Combo' : 'Individual'}
                    </span>
                  </td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <span className={`badge ${product.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/products/${product._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="View"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/products/${product._id}/edit`)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(product._id)}
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
                  No products found
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Products</h3>
            <p className="text-gray-600 mb-4">
              Upload an Excel (.xlsx) or CSV file. Rows with an existing product code will update that product;
              rows without a code will create a new product.
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
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

export default ProductListPage
