import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customerService } from '../../services/customerService'
import toast from 'react-hot-toast'
import { CUSTOMER_TYPE } from '../../config/constants'

const CustomerCreatePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      stateCode: '',
      country: 'India',
      pincode: ''
    },
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      stateCode: '',
      country: 'India',
      pincode: ''
    },
    customerType: CUSTOMER_TYPE.BUSINESS,
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [sameAsBilling, setSameAsBilling] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSameAsBilling = (e) => {
    const checked = e.target.checked
    setSameAsBilling(checked)
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress }
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)
    try {
      const response = await customerService.createCustomer(formData)
      if (response.success) {
        toast.success('Customer created successfully')
        navigate('/customers')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
        <p className="text-gray-600">Fill in the customer details below</p>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 md:gap-10 grid-cols-1 gap-5">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`input ${errors.companyName ? 'border-red-500' : ''}`}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternate Phone
              </label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Type
              </label>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="input"
              >
                <option value={CUSTOMER_TYPE.BUSINESS}>Business</option>
                <option value={CUSTOMER_TYPE.INDIVIDUAL}>Individual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="billingAddress.street"
                value={formData.billingAddress.street}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="billingAddress.city"
                value={formData.billingAddress.city}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                name="billingAddress.state"
                value={formData.billingAddress.state}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State Code
              </label>
              <input
                type="text"
                name="billingAddress.stateCode"
                value={formData.billingAddress.stateCode}
                onChange={handleChange}
                className="input"
                placeholder="e.g., TN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                name="billingAddress.pincode"
                value={formData.billingAddress.pincode}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="sameAsBilling"
              checked={sameAsBilling}
              onChange={handleSameAsBilling}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="sameAsBilling" className="text-sm font-medium text-gray-700">
              Same as billing address
            </label>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="shippingAddress.street"
                value={formData.shippingAddress.street}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="shippingAddress.city"
                value={formData.shippingAddress.city}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                name="shippingAddress.state"
                value={formData.shippingAddress.state}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State Code
              </label>
              <input
                type="text"
                name="shippingAddress.stateCode"
                value={formData.shippingAddress.stateCode}
                onChange={handleChange}
                className="input"
                placeholder="e.g., TN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                name="shippingAddress.pincode"
                value={formData.shippingAddress.pincode}  
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn bg-black text-white"
          >
            {loading ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CustomerCreatePage
