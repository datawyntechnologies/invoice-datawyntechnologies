import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi'
import { invoiceService } from '../../services/invoiceService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { companyService } from '../../services/companyService'
import toast from 'react-hot-toast'
import { PAYMENT_TERMS, UNITS, DEFAULT_TERMS } from '../../config/constants'
import { calculateInvoiceTotals } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatCurrency'
import PaymentPlanForm from '../../components/PaymentPlanForm'

const ProformaCreatePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [companySettings, setCompanySettings] = useState(null)
  
  const [formData, setFormData] = useState({
    customer: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    paymentTerms: 'Due on Receipt',
    placeOfSupply: '',
    notes: '',
    termsAndConditions: DEFAULT_TERMS.join('\n'),
    items: [],
    enableGST: true
  })

  const [paymentPlan, setPaymentPlan] = useState(null)

  // Debug payment plan changes
  useEffect(() => {
    console.log('ProformaCreatePage - paymentPlan state changed:', paymentPlan)
  }, [paymentPlan])

  const handlePaymentPlanChange = useCallback((data) => {
    console.log('ProformaCreatePage - received payment plan data:', data)
    setPaymentPlan(data)
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [customersRes, productsRes, companyRes] = await Promise.all([
        customerService.getCustomers(),
        productService.getProducts({ limit: 1000 }), // Fetch all products for dropdown
        companyService.getCompanySettings()
      ])
      
      if (customersRes.success) setCustomers(customersRes.data.items || customersRes.data)
      if (productsRes.success) setProducts(productsRes.data.items || productsRes.data)
      if (companyRes.success) {
        setCompanySettings(companyRes.data)
        setFormData(prev => ({
          ...prev,
          paymentTerms: companyRes.data.invoiceSettings?.defaultPaymentTerms || 'Due on Receipt',
          termsAndConditions: companyRes.data.invoiceSettings?.defaultTerms || DEFAULT_TERMS.join('\n')
        }))
      }
    } catch (error) {
      toast.error('Failed to load initial data')
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: '',
          priceRange: 'standard',
          quantity: 1,
          rate: 0,
          discount: 0,
          discountType: 'fixed',
          gstRate: 0 // Default to 0 since we removed gstRate from product model
        }
      ]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // If product is selected, auto-fill details based on price range
      if (field === 'product' || field === 'priceRange') {
        const product = products.find(p => p._id === newItems[index].product)
        if (product && product.priceRanges) {
          const priceRange = newItems[index].priceRange || 'standard'
          newItems[index] = {
            ...newItems[index],
            rate: Number(product.priceRanges[priceRange]) || 0,
            gstRate: 0 // Default to 0 since we removed gstRate from product model
          }
        }
      }
      
      return { ...prev, items: newItems }
    })
  }

  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({ ...prev, customer: customerId }))
    
    // Auto-fill place of supply from customer state
    const customer = customers.find(c => c._id === customerId)
    if (customer?.billingAddress?.state) {
      setFormData(prev => ({ ...prev, placeOfSupply: customer.billingAddress.state }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customer) {
      toast.error('Please select a customer')
      return
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setLoading(true)
    try {
      const submissionData = {
        ...formData,
        // Only include paymentPlan if it has a planType
        ...(paymentPlan && paymentPlan.planType ? { paymentPlan } : {})
      }

      // console.log('Submitting proforma invoice with data:', {
      //   hasPaymentPlan: !!paymentPlan,
      //   planType: paymentPlan?.planType,
      //   paymentMethod: paymentPlan?.paymentMethod,
      //   hasSchedule: !!paymentPlan?.paymentSchedule,
      //   scheduleLength: paymentPlan?.paymentSchedule?.length
      // })

      const response = await invoiceService.createProformaInvoice(submissionData)
      if (response.success) {
        toast.success('Proforma invoice created successfully')
        navigate(`/proforma/${response.data._id}`)
      }
    } catch (error) {
      console.error('Error creating proforma invoice:', error)
      toast.error(error.response?.data?.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const calculations = useMemo(() => calculateInvoiceTotals(formData.items, 0, 'fixed', formData.enableGST), [formData.items, formData.enableGST])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Proforma Invoice</h1>
          <p className="text-gray-600">Fill in the invoice details below</p>
        </div>
        <button
          onClick={() => navigate('/proforma')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Enable GST</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, enableGST: !prev.enableGST }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.enableGST ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.enableGST ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                value={formData.customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="input"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms (Legacy)
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className="input"
              >
                {PAYMENT_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Use the Payment Plan section below for advanced payment scheduling</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Place of Supply
              </label>
              <input
                type="text"
                value={formData.placeOfSupply}
                onChange={(e) => setFormData(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn bg-black text-white flex items-center gap-2"
            >
              <FiPlus size={20} />
              Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet</p>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product/Service *
                      </label>
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(index, 'product', e.target.value)}
                        className="input"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.filter(p => p.status === 'active').map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range
                      </label>
                      <select
                        value={item.priceRange || 'standard'}
                        onChange={(e) => updateItem(index, 'priceRange', e.target.value)}
                        className="input"
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value) || 0)}
                        min="1"
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate *
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', Number(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST %
                      </label>
                      <input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) => updateItem(index, 'gstRate', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="input"
                        disabled={!formData.enableGST}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn btn-danger w-max"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="input flex-1"
                        />
                        <select
                          value={item.discountType}
                          onChange={(e) => updateItem(index, 'discountType', e.target.value)}
                          className="input w-24"
                        >
                          <option value="fixed">₹</option>
                          <option value="percentage">%</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Total
                      </label>
                      <div className="p-2 bg-gray-50 rounded-lg font-medium">
                        {formatCurrency(calculations.items[index]?.total || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {formData.items.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculations.itemDiscount + calculations.invoiceDiscount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(calculations.finalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes & Terms */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="input"
                placeholder="Any additional notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                rows={3}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Payment Plan */}
        <PaymentPlanForm
          totalAmount={calculations.finalAmount}
          invoiceDate={formData.invoiceDate}
          onChange={handlePaymentPlanChange}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn bg-black text-white flex items-center gap-2"
          >
            <FiSave size={20} />
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProformaCreatePage
