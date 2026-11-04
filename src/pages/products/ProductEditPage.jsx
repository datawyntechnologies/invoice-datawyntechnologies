import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productService } from '../../services/productService'
import toast from 'react-hot-toast'

const ProductEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    productType: 'individual',
    names: [''],
    description: '',
    priceRanges: {
      basic: '',
      standard: '',
      premium: '',
      custom: ''
    },
    status: 'active'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await productService.getProduct(id)
      if (response.success) {
        const product = response.data
        setFormData({
          productType: product.productType || 'individual',
          names: product.name ? product.name.split(', ').map(n => n.trim()) : [''],
          description: product.description || '',
          priceRanges: {
            basic: product.priceRanges?.basic?.toString() || '',
            standard: product.priceRanges?.standard?.toString() || '',
            premium: product.priceRanges?.premium?.toString() || '',
            custom: product.priceRanges?.custom?.toString() || ''
          },
          status: product.status || 'active'
        })
      }
    } catch (error) {
      toast.error('Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle nested price ranges
    if (name.startsWith('priceRanges.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        priceRanges: {
          ...prev.priceRanges,
          [field]: value
        }
      }))

      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    } else if (name.startsWith('names.')) {
      const index = parseInt(name.split('.')[1])
      setFormData(prev => ({
        ...prev,
        names: prev.names.map((n, i) => i === index ? value : n)
      }))

      if (errors.name) {
        setErrors(prev => ({ ...prev, name: '' }))
      }
    } else if (name === 'productType') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        names: value === 'individual' ? [prev.names[0] || ''] : prev.names
      }))

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
    }
  }

  const handleAddName = () => {
    setFormData(prev => ({
      ...prev,
      names: [...prev.names, '']
    }))
  }

  const handleRemoveName = (index) => {
    setFormData(prev => ({
      ...prev,
      names: prev.names.filter((_, i) => i !== index)
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (formData.productType === 'individual') {
      if (!formData.names[0].trim()) {
        newErrors.name = 'Product name is required'
      }
    } else {
      if (formData.names.length === 0 || formData.names.every(name => !name.trim())) {
        newErrors.name = 'At least one product name is required'
      }
    }

    if (!formData.priceRanges.basic || parseFloat(formData.priceRanges.basic) < 0) {
      newErrors.basic = 'Valid basic price is required'
    }

    if (!formData.priceRanges.standard || parseFloat(formData.priceRanges.standard) < 0) {
      newErrors.standard = 'Valid standard price is required'
    }

    if (!formData.priceRanges.premium || parseFloat(formData.priceRanges.premium) < 0) {
      newErrors.premium = 'Valid premium price is required'
    }

    if (formData.priceRanges.custom && parseFloat(formData.priceRanges.custom) < 0) {
      newErrors.custom = 'Custom price cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      const response = await productService.updateProduct(id, {
        productType: formData.productType,
        name: formData.productType === 'individual' ? formData.names[0] : formData.names.filter(n => n.trim()).join(', '),
        description: formData.description,
        priceRanges: {
          basic: parseFloat(formData.priceRanges.basic),
          standard: parseFloat(formData.priceRanges.standard),
          premium: parseFloat(formData.priceRanges.premium),
          custom: formData.priceRanges.custom ? parseFloat(formData.priceRanges.custom) : undefined
        },
        status: formData.status
      })
      if (response.success) {
        toast.success('Product updated successfully')
        navigate('/products')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product')
    } finally {
      setSaving(false)
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
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product/Service</h1>
        <p className="text-gray-600">Update product details below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type *
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="input"
              >
                <option value="individual">Individual Product</option>
                <option value="combo">Combo Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name(s) *
              </label>
              <div className="space-y-2">
                {formData.names.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      name={`names.${index}`}
                      value={name}
                      onChange={handleChange}
                      className={`input flex-1 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder={formData.productType === 'individual' ? 'Product name' : `Product ${index + 1} name`}
                    />
                    {formData.productType === 'combo' && formData.names.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveName(index)}
                        className="btn btn-danger px-3"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {formData.productType === 'combo' && (
                  <button
                    type="button"
                    onClick={handleAddName}
                    className="btn btn-secondary text-sm"
                  >
                    + Add Product
                  </button>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basic Price *
              </label>
              <input
                type="number"
                name="priceRanges.basic"
                value={formData.priceRanges.basic}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input ${errors.basic ? 'border-red-500' : ''}`}
              />
              {errors.basic && (
                <p className="mt-1 text-sm text-red-600">{errors.basic}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Price *
              </label>
              <input
                type="number"
                name="priceRanges.standard"
                value={formData.priceRanges.standard}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input ${errors.standard ? 'border-red-500' : ''}`}
              />
              {errors.standard && (
                <p className="mt-1 text-sm text-red-600">{errors.standard}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Premium Price *
              </label>
              <input
                type="number"
                name="priceRanges.premium"
                value={formData.priceRanges.premium}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input ${errors.premium ? 'border-red-500' : ''}`}
              />
              {errors.premium && (
                <p className="mt-1 text-sm text-red-600">{errors.premium}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Price
              </label>
              <input
                type="number"
                name="priceRanges.custom"
                value={formData.priceRanges.custom}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`input ${errors.custom ? 'border-red-500' : ''}`}
              />
              {errors.custom && (
                <p className="mt-1 text-sm text-red-600">{errors.custom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductEditPage
