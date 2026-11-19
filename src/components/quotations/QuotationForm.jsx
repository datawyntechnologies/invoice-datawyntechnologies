import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiTrash2, FiUserPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { customerService } from '../../services/customerService'
import { formatCurrency } from '../../utils/formatCurrency'
import { QUOTATION_DEFAULT_TERMS, UNITS } from '../../config/constants'

const today = () => new Date().toISOString().split('T')[0]

const emptyItem = () => ({
  serviceName: '',
  description: '',
  quantity: 1,
  unit: 'Project',
  unitPrice: '',
  discount: 0,
  discountType: 'fixed'
})

const emptyPaymentTerm = (paymentType) => ({
  stage: '',
  description: '',
  percentage: paymentType === 'percentage' ? '' : undefined,
  amount: paymentType === 'percentage' ? undefined : '',
  dueDate: ''
})

const emptyMilestone = () => ({
  title: '',
  description: '',
  expectedDate: '',
  duration: ''
})

const toDateInput = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return ''
  return d.toISOString().split('T')[0]
}

const linesToArray = (text) =>
  String(text || '').split('\n').map(l => l.trim()).filter(Boolean)

const arrayToLines = (arr) => (Array.isArray(arr) ? arr.filter(Boolean).join('\n') : '')

const QuotationForm = ({ initialData, onSubmit, submitting, submitLabel = 'Save Quotation' }) => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  const [form, setForm] = useState({
    customer: '',
    quotationDate: today(),
    validUntil: '',
    contactPerson: '',
    email: '',
    phone: '',
    billingAddress: { street: '', city: '', state: '', stateCode: '', country: 'India', pincode: '' },
    projectName: '',
    projectCategory: '',
    projectDescription: '',
    items: [emptyItem()],
    discountType: 'fixed',
    discountValue: 0,
    additionalCharges: 0,
    taxRate: 18,
    timeline: {
      estimatedStartDate: '',
      estimatedDuration: '',
      deliveryDate: '',
      milestones: []
    },
    paymentType: 'percentage',
    paymentTerms: [emptyPaymentTerm('percentage'), emptyPaymentTerm('percentage')],
    inclusionsText: '',
    exclusionsText: '',
    termsAndConditions: QUOTATION_DEFAULT_TERMS,
    notes: '',
    internalRemarks: '',
    preparedBy: ''
  })

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await customerService.getCustomers({ limit: 500 })
        const items = response.data?.items || response.data || []
        setCustomers(Array.isArray(items) ? items : [])
      } catch {
        toast.error('Failed to load customers')
      } finally {
        setLoadingCustomers(false)
      }
    }
    loadCustomers()
  }, [])

  useEffect(() => {
    if (!initialData) return
    const q = initialData
    setForm({
      customer: q.customer?._id || q.customer || '',
      quotationDate: toDateInput(q.quotationDate) || today(),
      validUntil: toDateInput(q.validUntil),
      contactPerson: q.contactPerson || '',
      email: q.email || '',
      phone: q.phone || '',
      billingAddress: {
        street: q.billingAddress?.street || '',
        city: q.billingAddress?.city || '',
        state: q.billingAddress?.state || '',
        stateCode: q.billingAddress?.stateCode || '',
        country: q.billingAddress?.country || 'India',
        pincode: q.billingAddress?.pincode || ''
      },
      projectName: q.projectName || '',
      projectCategory: q.projectCategory || '',
      projectDescription: q.projectDescription || '',
      items: (q.items || []).length
        ? q.items.map(item => ({
            serviceName: item.serviceName || '',
            description: item.description || '',
            quantity: item.quantity ?? 1,
            unit: item.unit || 'Project',
            unitPrice: item.unitPrice ?? '',
            discount: item.discount ?? 0,
            discountType: item.discountType || 'fixed'
          }))
        : [emptyItem()],
      discountType: q.discountType || 'fixed',
      discountValue: q.discountValue ?? 0,
      additionalCharges: q.additionalCharges ?? 0,
      taxRate: q.taxRate ?? 0,
      timeline: {
        estimatedStartDate: toDateInput(q.timeline?.estimatedStartDate),
        estimatedDuration: q.timeline?.estimatedDuration || '',
        deliveryDate: toDateInput(q.timeline?.deliveryDate),
        milestones: (q.timeline?.milestones || []).map(m => ({
          title: m.title || '',
          description: m.description || '',
          expectedDate: toDateInput(m.expectedDate),
          duration: m.duration || ''
        }))
      },
      paymentType: q.paymentType || 'percentage',
      paymentTerms: (q.paymentTerms || []).length
        ? q.paymentTerms.map(p => ({
            stage: p.stage || '',
            description: p.description || '',
            percentage: p.percentage,
            amount: p.amount,
            dueDate: toDateInput(p.dueDate)
          }))
        : [emptyPaymentTerm(q.paymentType || 'percentage')],
      inclusionsText: arrayToLines(q.inclusions),
      exclusionsText: arrayToLines(q.exclusions),
      termsAndConditions: q.termsAndConditions || QUOTATION_DEFAULT_TERMS,
      notes: q.notes || '',
      internalRemarks: q.internalRemarks || '',
      preparedBy: q.preparedBy || ''
    })
  }, [initialData])

  // ---------- Live calculations (mirrors backend) ----------
  const calc = useMemo(() => {
    const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100
    const items = form.items.map(item => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      const discount = Number(item.discount) || 0
      const gross = quantity * unitPrice
      const discountAmount = item.discountType === 'percentage'
        ? round2((gross * Math.min(discount, 100)) / 100)
        : round2(Math.min(discount, gross))
      return { ...item, gross: round2(gross), discountAmount, total: round2(Math.max(0, gross - discountAmount)) }
    })
    const subtotal = round2(items.reduce((s, i) => s + i.gross, 0))
    const lineDiscountTotal = round2(items.reduce((s, i) => s + i.discountAmount, 0))
    const afterLine = round2(Math.max(0, subtotal - lineDiscountTotal))
    const discountValue = Number(form.discountValue) || 0
    const discountAmount = form.discountType === 'percentage'
      ? round2((afterLine * Math.min(discountValue, 100)) / 100)
      : round2(Math.min(discountValue, afterLine))
    const additionalCharges = round2(Number(form.additionalCharges) || 0)
    const taxableAmount = round2(Math.max(0, afterLine - discountAmount + additionalCharges))
    const taxRate = Number(form.taxRate) || 0
    const taxAmount = round2((taxableAmount * taxRate) / 100)
    const grandTotal = round2(taxableAmount + taxAmount)

    // Payment milestone preview (aligned with form.paymentTerms indexes)
    const pctSum = form.paymentTerms.reduce((s, t) => s + (t.stage?.trim() ? (Number(t.percentage) || 0) : 0), 0)
    const fixedProvided = round2(form.paymentTerms.reduce((s, t) => s + (t.stage?.trim() && form.paymentType !== 'percentage' ? (Number(t.amount) || 0) : 0), 0))
    const fixedDiff = round2(grandTotal - fixedProvided)
    const filledCount = form.paymentTerms.filter(t => t.stage?.trim()).length
    let running = 0
    let lastFilledIndex = -1
    form.paymentTerms.forEach((t, i) => { if (t.stage?.trim()) lastFilledIndex = i })

    const paymentPreview = form.paymentTerms.map((t, i) => {
      if (!t.stage?.trim()) return null
      if (form.paymentType === 'percentage') {
        const isLast = i === lastFilledIndex
        const pct = Number(t.percentage) || 0
        const amount = isLast ? round2(grandTotal - running) : round2((grandTotal * pct) / 100)
        if (!isLast) running = round2(running + amount)
        return { amount: Math.max(0, amount), pctSum }
      }
      const isLast = i === lastFilledIndex
      const base = round2(Number(t.amount) || 0)
      return { amount: isLast && Math.abs(fixedDiff) > 0.009 ? round2(Math.max(0, base + fixedDiff)) : base }
    })

    return { items, subtotal, lineDiscountTotal, discountAmount, additionalCharges, taxableAmount, taxAmount, grandTotal, paymentPreview }
  }, [form.items, form.discountType, form.discountValue, form.additionalCharges, form.taxRate, form.paymentTerms, form.paymentType])

  // ---------- Handlers ----------

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const setNested = (parent, key, value) => setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }))
  const setAddress = (key, value) => setForm(prev => ({ ...prev, billingAddress: { ...prev.billingAddress, [key]: value } }))

  const handleCustomerChange = (customerId) => {
    set('customer', customerId)
    const customer = customers.find(c => c._id === customerId)
    if (!customer) return
    setForm(prev => ({
      ...prev,
      customer: customerId,
      contactPerson: customer.contactPerson || prev.contactPerson,
      email: customer.email || prev.email,
      phone: customer.phone || prev.phone,
      billingAddress: {
        street: customer.billingAddress?.street || '',
        city: customer.billingAddress?.city || '',
        state: customer.billingAddress?.state || '',
        stateCode: customer.billingAddress?.stateCode || '',
        country: customer.billingAddress?.country || 'India',
        pincode: customer.billingAddress?.pincode || ''
      }
    }))
  }

  const updateItem = (index, key, value) => {
    setForm(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [key]: value }
      return { ...prev, items }
    })
  }

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] }))
  const removeItem = (index) => setForm(prev => ({
    ...prev,
    items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items
  }))

  const updatePaymentTerm = (index, key, value) => {
    setForm(prev => {
      const paymentTerms = [...prev.paymentTerms]
      paymentTerms[index] = { ...paymentTerms[index], [key]: value }
      return { ...prev, paymentTerms }
    })
  }

  const addPaymentTerm = () => setForm(prev => ({ ...prev, paymentTerms: [...prev.paymentTerms, emptyPaymentTerm(prev.paymentType)] }))
  const removePaymentTerm = (index) => setForm(prev => ({
    ...prev,
    paymentTerms: prev.paymentTerms.length > 1 ? prev.paymentTerms.filter((_, i) => i !== index) : prev.paymentTerms
  }))

  const handlePaymentTypeChange = (type) => {
    setForm(prev => ({
      ...prev,
      paymentType: type,
      paymentTerms: prev.paymentTerms.map(t => ({
        stage: t.stage,
        description: t.description,
        percentage: type === 'percentage' ? (t.percentage ?? '') : undefined,
        amount: type === 'percentage' ? undefined : (t.amount ?? ''),
        dueDate: t.dueDate
      }))
    }))
  }

  const updateMilestone = (index, key, value) => {
    setForm(prev => {
      const milestones = [...prev.timeline.milestones]
      milestones[index] = { ...milestones[index], [key]: value }
      return { ...prev, timeline: { ...prev.timeline, milestones } }
    })
  }
  const addMilestone = () => setForm(prev => ({ ...prev, timeline: { ...prev.timeline, milestones: [...prev.timeline.milestones, emptyMilestone()] } }))
  const removeMilestone = (index) => setForm(prev => ({
    ...prev,
    timeline: { ...prev.timeline, milestones: prev.timeline.milestones.filter((_, i) => i !== index) }
  }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.customer) return toast.error('Please select a client')
    if (!form.projectName.trim()) return toast.error('Project name is required')
    const validItems = form.items.filter(i => i.serviceName.trim())
    if (!validItems.length) return toast.error('Add at least one service')
    const filledTerms = form.paymentTerms.filter(t => t.stage?.trim())
    if (form.paymentType === 'percentage' && filledTerms.length) {
      const pctTotal = filledTerms.reduce((s, t) => s + (Number(t.percentage) || 0), 0)
      if (Math.abs(pctTotal - 100) > 0.01) {
        return toast.error(`Payment percentages must total 100% (currently ${pctTotal}%)`)
      }
    }

    onSubmit({
      customer: form.customer,
      quotationDate: form.quotationDate || undefined,
      validUntil: form.validUntil || undefined,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      billingAddress: form.billingAddress,
      projectName: form.projectName,
      projectCategory: form.projectCategory,
      projectDescription: form.projectDescription,
      items: form.items.filter(i => i.serviceName.trim()).map(i => ({
        serviceName: i.serviceName,
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unit: i.unit,
        unitPrice: Number(i.unitPrice) || 0,
        discount: Number(i.discount) || 0,
        discountType: i.discountType
      })),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      additionalCharges: Number(form.additionalCharges) || 0,
      taxRate: Number(form.taxRate) || 0,
      timeline: {
        estimatedStartDate: form.timeline.estimatedStartDate || undefined,
        estimatedDuration: form.timeline.estimatedDuration,
        deliveryDate: form.timeline.deliveryDate || undefined,
        milestones: form.timeline.milestones.filter(m => m.title.trim()).map(m => ({
          title: m.title,
          description: m.description,
          expectedDate: m.expectedDate || undefined,
          duration: m.duration
        }))
      },
      paymentType: form.paymentType,
      paymentTerms: form.paymentTerms.filter(t => t.stage?.trim()).map(t => ({
        stage: t.stage,
        description: t.description,
        percentage: form.paymentType === 'percentage' ? (Number(t.percentage) || 0) : undefined,
        amount: form.paymentType === 'percentage' ? undefined : (Number(t.amount) || 0),
        dueDate: t.dueDate || undefined
      })),
      inclusions: linesToArray(form.inclusionsText),
      exclusions: linesToArray(form.exclusionsText),
      termsAndConditions: form.termsAndConditions,
      notes: form.notes,
      internalRemarks: form.internalRemarks,
      preparedBy: form.preparedBy
    })
  }

  const inputCls = 'input'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A: Basic Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Quotation Number</label>
            <input type="text" value={initialData?.quotationNumber || 'Auto-generated on save'} disabled className="input bg-gray-50" />
          </div>
          <div>
            <label className={labelCls}>Quotation Date *</label>
            <input type="date" value={form.quotationDate} onChange={e => set('quotationDate', e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Valid Until</label>
            <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Client *</label>
              <button type="button" onClick={() => navigate('/customers/new')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                <FiUserPlus size={12} /> New Client
              </button>
            </div>
            <select value={form.customer} onChange={e => handleCustomerChange(e.target.value)} className={inputCls} required disabled={loadingCustomers}>
              <option value="">{loadingCustomers ? 'Loading clients...' : 'Select client'}</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Contact Person</label>
            <input type="text" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <label className={labelCls}>Street</label>
              <input type="text" value={form.billingAddress.street} onChange={e => setAddress('street', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input type="text" value={form.billingAddress.city} onChange={e => setAddress('city', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input type="text" value={form.billingAddress.state} onChange={e => setAddress('state', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PIN Code</label>
              <input type="text" value={form.billingAddress.pincode} onChange={e => setAddress('pincode', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Project Name *</label>
            <input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Project Category</label>
            <input type="text" value={form.projectCategory} onChange={e => set('projectCategory', e.target.value)} className={inputCls} placeholder="e.g. Web Development" />
          </div>
          <div>
            <label className={labelCls}>Prepared By</label>
            <input type="text" value={form.preparedBy} onChange={e => set('preparedBy', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-3">
            <label className={labelCls}>Project Description</label>
            <textarea value={form.projectDescription} onChange={e => set('projectDescription', e.target.value)} className={inputCls + ' h-20'} />
          </div>
        </div>
      </div>

      {/* Section B: Scope of Work */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Scope of Work & Services</h2>
          <button type="button" onClick={addItem} className="btn btn-secondary text-sm flex items-center gap-1">
            <FiPlus size={16} /> Add Service
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">S.No</th>
                <th>Service / Product Name</th>
                <th>Description</th>
                <th className="w-20">Qty</th>
                <th className="w-28">Unit</th>
                <th className="w-28">Unit Price (₹)</th>
                <th className="w-28">Discount</th>
                <th className="w-28">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => {
                const calcItem = calc.items[index] || item
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input type="text" value={item.serviceName} onChange={e => updateItem(index, 'serviceName', e.target.value)} className="input" placeholder="e.g. UI/UX Design" required />
                    </td>
                    <td>
                      <input type="text" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="input" placeholder="Optional description" />
                    </td>
                    <td>
                      <input type="number" min="0" step="any" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="input" />
                    </td>
                    <td>
                      <select value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} className="input">
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" min="0" step="any" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="input" placeholder="0.00" />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <input type="number" min="0" step="any" value={item.discount} onChange={e => updateItem(index, 'discount', e.target.value)} className="input" />
                        <select value={item.discountType} onChange={e => updateItem(index, 'discountType', e.target.value)} className="input w-16 px-1">
                          <option value="fixed">₹</option>
                          <option value="percentage">%</option>
                        </select>
                      </div>
                    </td>
                    <td className="font-medium whitespace-nowrap">{formatCurrency(calcItem.total)}</td>
                    <td>
                      <button type="button" onClick={() => removeItem(index)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600" disabled={form.items.length <= 1}>
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Pricing Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Invoice Discount Type</label>
              <select value={form.discountType} onChange={e => set('discountType', e.target.value)} className={inputCls}>
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Discount Value</label>
              <input type="number" min="0" step="any" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Additional Charges (₹)</label>
              <input type="number" min="0" step="any" value={form.additionalCharges} onChange={e => set('additionalCharges', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GST / Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="any" value={form.taxRate} onChange={e => set('taxRate', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatCurrency(calc.subtotal)}</span></div>
            {calc.lineDiscountTotal > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">Line-item Discounts</span><span className="font-medium text-red-600">-{formatCurrency(calc.lineDiscountTotal)}</span></div>
            )}
            {calc.discountAmount > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="font-medium text-red-600">-{formatCurrency(calc.discountAmount)}</span></div>
            )}
            {calc.additionalCharges > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">Additional Charges</span><span className="font-medium">{formatCurrency(calc.additionalCharges)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-600">Taxable Amount</span><span className="font-medium">{formatCurrency(calc.taxableAmount)}</span></div>
            {calc.taxAmount > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">GST ({form.taxRate}%)</span><span className="font-medium">{formatCurrency(calc.taxAmount)}</span></div>
            )}
            <div className="border-t pt-2 flex justify-between text-base font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(calc.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Project Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
          <button type="button" onClick={addMilestone} className="btn btn-secondary text-sm flex items-center gap-1">
            <FiPlus size={16} /> Add Milestone
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelCls}>Estimated Start Date</label>
            <input type="date" value={form.timeline.estimatedStartDate} onChange={e => setNested('timeline', 'estimatedStartDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estimated Duration</label>
            <input type="text" value={form.timeline.estimatedDuration} onChange={e => setNested('timeline', 'estimatedDuration', e.target.value)} className={inputCls} placeholder="e.g. 8 Weeks" />
          </div>
          <div>
            <label className={labelCls}>Delivery Date</label>
            <input type="date" value={form.timeline.deliveryDate} onChange={e => setNested('timeline', 'deliveryDate', e.target.value)} className={inputCls} />
          </div>
        </div>
        {form.timeline.milestones.length > 0 && (
          <div className="space-y-3">
            {form.timeline.milestones.map((milestone, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className={labelCls}>Milestone Title</label>
                  <input type="text" value={milestone.title} onChange={e => updateMilestone(index, 'title', e.target.value)} className={inputCls} placeholder="e.g. Design Approval" />
                </div>
                <div className="md:col-span-3">
                  <label className={labelCls}>Expected Date</label>
                  <input type="date" value={milestone.expectedDate} onChange={e => updateMilestone(index, 'expectedDate', e.target.value)} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Duration</label>
                  <input type="text" value={milestone.duration} onChange={e => updateMilestone(index, 'duration', e.target.value)} className={inputCls} placeholder="e.g. 2 weeks" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <input type="text" value={milestone.description} onChange={e => updateMilestone(index, 'description', e.target.value)} className={inputCls} />
                </div>
                <div className="md:col-span-1">
                  <button type="button" onClick={() => removeMilestone(index)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 w-full flex justify-center">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section E: Payment Terms */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Terms</h2>
          <button type="button" onClick={addPaymentTerm} className="btn btn-secondary text-sm flex items-center gap-1">
            <FiPlus size={16} /> Add Milestone
          </button>
        </div>
        <div className="mb-4">
          <label className={labelCls}>Payment Type</label>
          <div className="flex gap-4">
            {[
              ['percentage', 'Percentage-based'],
              ['fixed', 'Fixed Amount'],
              ['custom', 'Custom Milestones']
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="radio" name="paymentType" checked={form.paymentType === value} onChange={() => handlePaymentTypeChange(value)} className="text-primary-600" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Stage / Milestone</th>
                <th>Description</th>
                {form.paymentType === 'percentage' ? <th className="w-28">Percentage (%)</th> : <th className="w-36">Amount (₹)</th>}
                <th className="w-40">Due Date</th>
                <th className="w-28">Calculated (₹)</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.paymentTerms.map((term, index) => {
                const preview = calc.paymentPreview[index]
                return (
                  <tr key={index}>
                    <td>
                      <input type="text" value={term.stage} onChange={e => updatePaymentTerm(index, 'stage', e.target.value)} className="input" placeholder="e.g. Advance Payment" required />
                    </td>
                    <td>
                      <input type="text" value={term.description} onChange={e => updatePaymentTerm(index, 'description', e.target.value)} className="input" placeholder="Optional" />
                    </td>
                    {form.paymentType === 'percentage' ? (
                      <td>
                        <input type="number" min="0" max="100" step="any" value={term.percentage ?? ''} onChange={e => updatePaymentTerm(index, 'percentage', e.target.value)} className="input" placeholder="0" />
                      </td>
                    ) : (
                      <td>
                        <input type="number" min="0" step="any" value={term.amount ?? ''} onChange={e => updatePaymentTerm(index, 'amount', e.target.value)} className="input" placeholder="0.00" />
                      </td>
                    )}
                    <td>
                      <input type="date" value={term.dueDate || ''} onChange={e => updatePaymentTerm(index, 'dueDate', e.target.value)} className="input" />
                    </td>
                    <td className="font-medium whitespace-nowrap">{preview ? formatCurrency(preview.amount) : '-'}</td>
                    <td>
                      <button type="button" onClick={() => removePaymentTerm(index)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600" disabled={form.paymentTerms.length <= 1}>
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {form.paymentType === 'percentage' && (
          <p className="text-xs text-gray-500 mt-2">
            Percentages must total 100%. Amounts are calculated from the grand total ({formatCurrency(calc.grandTotal)}).
          </p>
        )}
        {form.paymentType !== 'percentage' && calc.paymentPreview.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Milestone amounts are adjusted so the total equals the grand total ({formatCurrency(calc.grandTotal)}).
          </p>
        )}
      </div>

      {/* Section F: Additional Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Included Services (one per line)</label>
            <textarea value={form.inclusionsText} onChange={e => set('inclusionsText', e.target.value)} className={inputCls + ' h-28'} placeholder={'UI/UX Design\nFrontend Development\nTesting & Deployment'} />
          </div>
          <div>
            <label className={labelCls}>Excluded Services (one per line)</label>
            <textarea value={form.exclusionsText} onChange={e => set('exclusionsText', e.target.value)} className={inputCls + ' h-28'} placeholder={'Content Writing\nStock Photography\nThird-party Licenses'} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Terms & Conditions</label>
            <textarea value={form.termsAndConditions} onChange={e => set('termsAndConditions', e.target.value)} className={inputCls + ' h-40'} />
          </div>
          <div>
            <label className={labelCls}>Notes (visible to client)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls + ' h-24'} />
          </div>
          <div>
            <label className={labelCls}>Internal Remarks (never shown to client)</label>
            <textarea value={form.internalRemarks} onChange={e => set('internalRemarks', e.target.value)} className={inputCls + ' h-24 bg-yellow-50'} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default QuotationForm
