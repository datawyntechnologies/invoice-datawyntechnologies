import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiEdit, FiArrowLeft } from 'react-icons/fi'
import { productService } from '../../services/productService'
import { formatDate } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'

const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await productService.getProduct(id)
      if (response.success) {
        setProduct(response.data)
      }
    } catch (error) {
      toast.error('Failed to fetch product details')
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

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft size={20} />
          Back to Products
        </button>
        <button
          onClick={() => navigate(`/products/${id}/edit`)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiEdit size={20} />
          Edit Product
        </button>
      </div>

      {/* Product Details */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Product Code</p>
            <p className="font-medium text-gray-900">{product.code || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Product Name</p>
            <p className="font-medium text-gray-900">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Product Type</p>
            <p className="font-medium text-gray-900 capitalize">{product.productType || 'individual'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`badge ${product.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
              {product.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created Date</p>
            <p className="font-medium text-gray-900">{formatDate(product.createdAt)}</p>
          </div>
        </div>

        {product.description && (
          <div className="mt-6">
            <p className="text-sm text-gray-600">Description</p>
            <p className="font-medium text-gray-900 mt-1">{product.description}</p>
          </div>
        )}
      </div>

      {/* Price Ranges */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Ranges</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Basic Price</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {formatCurrency(product.priceRanges?.basic || 0)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Standard Price</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {formatCurrency(product.priceRanges?.standard || 0)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Premium Price</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {formatCurrency(product.priceRanges?.premium || 0)}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Custom Price</p>
            <p className="text-2xl font-bold text-orange-900 mt-2">
              {formatCurrency(product.priceRanges?.custom || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
