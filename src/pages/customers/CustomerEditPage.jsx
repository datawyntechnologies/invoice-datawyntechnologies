import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customerService } from '../../services/customerService'
import { customerTypeService } from '../../services/customerTypeService'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi'

const CustomerEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customerTypes, setCustomerTypes] = useState([])
  const [showAddTypeModal, setShowAddTypeModal] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [editingType, setEditingType] = useState(null)
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
    customerType: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [sameAsBilling, setSameAsBilling] = useState(false)

  useEffect(() => {
    fetchCustomerTypes()
  }, [])

  const fetchCustomerTypes = async () => {
    try {
      const response = await customerTypeService.getCustomerTypes()
      if (response.success) {
        setCustomerTypes(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer types:', error)
    }
  }

  const handleAddCustomerType = async (e) => {
    e.preventDefault()
    if (!newTypeName.trim()) {
      toast.error('Customer type name is required')
      return
    }

    try {
      const response = await customerTypeService.createCustomerType({
        name: newTypeName
      })
      if (response.success) {
        toast.success('Customer type added successfully')
        setNewTypeName('')
        setShowAddTypeModal(false)
        fetchCustomerTypes()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add customer type')
    }
  }

  const handleEditCustomerType = async (e) => {
    e.preventDefault()
    if (!newTypeName.trim()) {
      toast.error('Customer type name is required')
      return
    }

    try {
      const response = await customerTypeService.updateCustomerType(editingType._id, {
        name: newTypeName
      })
      if (response.success) {
        toast.success('Customer type updated successfully')
        setNewTypeName('')
        setEditingType(null)
        setShowAddTypeModal(false)
        fetchCustomerTypes()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer type')
    }
  }

  const handleDeleteCustomerType = async (typeId) => {
    try {
      const response = await customerTypeService.deleteCustomerType(typeId)
      if (response.success) {
        toast.success('Customer type deleted successfully')
        fetchCustomerTypes()
        if (formData.customerType === typeId) {
          setFormData(prev => ({ ...prev, customerType: customerTypes[0]?._id || '' }))
        }
      }
    } catch (error) {
      toast.error('Failed to delete customer type')
    }
  }

  const openAddModal = () => {
    setEditingType(null)
    setNewTypeName('')
    setShowAddTypeModal(true)
  }

  const openEditModal = (type) => {
    setEditingType(type)
    setNewTypeName(type.name)
    setShowAddTypeModal(true)
  }

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const response = await customerService.getCustomer(id)
      if (response.success) {
        const customer = response.data
        setFormData({
          companyName: customer.companyName || '',
          contactPerson: customer.contactPerson || '',
          email: customer.email || '',
          phone: customer.phone || '',
          alternatePhone: customer.alternatePhone || '',
          billingAddress: customer.billingAddress || {
            street: '',
            city: '',
            state: '',
            stateCode: '',
            country: 'India',
            pincode: ''
          },
          shippingAddress: customer.shippingAddress || {
            street: '',
            city: '',
            state: '',
            stateCode: '',
            country: 'India',
            pincode: ''
          },
          customerType: customer.customerType || '',
          notes: customer.notes || ''
        })
      }
    } catch (error) {
      toast.error('Failed to fetch customer')
    } finally {
      setLoading(false)
    }
  }

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
    
    setSaving(true)
    try {
      const response = await customerService.updateCustomer(id, formData)
      if (response.success) {
        toast.success('Customer updated successfully')
        navigate(`/customers/${id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer')
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
        <p className="text-gray-600">Update customer details below</p>
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
              <div className="flex gap-2">
                <select
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleChange}
                  className="input flex-1"
                >
                  {customerTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="btn btn-secondary px-3"
                  title="Add new customer type"
                >
                  <FiPlus size={18} />
                </button>
              </div>
              {customerTypes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {customerTypes.map((type) => (
                    <div key={type._id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                      <span>{type.name}</span>
                      <button
                        type="button"
                        onClick={() => openEditModal(type)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomerType(type._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            onClick={() => navigate(`/customers/${id}`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn bg-black text-white"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Add/Edit Customer Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingType ? 'Edit Customer Type' : 'Add Customer Type'}
            </h3>
            <form onSubmit={editingType ? handleEditCustomerType : handleAddCustomerType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type Name *
                </label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="input"
                  placeholder="e.g., VIP, Corporate, Individual"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingType ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerEditPage
