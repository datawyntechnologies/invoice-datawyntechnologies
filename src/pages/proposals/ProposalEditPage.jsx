import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi'
import { proposalService } from '../../services/proposalService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { companyService } from '../../services/companyService'
import toast from 'react-hot-toast'
import { PAYMENT_TERMS, DEFAULT_TERMS } from '../../config/constants'
import { calculateInvoiceTotals } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatCurrency'
import Modal from '../../components/common/Modal'

const ProposalEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [companySettings, setCompanySettings] = useState(null)
  const [showTechModal, setShowTechModal] = useState(false)
  const [newTechnology, setNewTechnology] = useState('')
  
  const [formData, setFormData] = useState({
    customer: '',
    proposalDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    projectTitle: '',
    projectSubtitle: '',
    projectDescription: '',
    objectives: '',
    proposedSolution: '',
    scopeOfWork: [],
    deliverables: [],
    technologyStack: [],
    timeline: {
      startDate: '',
      estimatedCompletionDate: '',
      duration: '',
      milestones: []
    },
    paymentTerms: '50% Advance, 50% on Completion',
    paymentSchedule: [],
    advanceAmount: 0,
    termsAndConditions: DEFAULT_TERMS.join('\n'),
    notes: '',
    internalNotes: '',
    preparedBy: '',
    items: [],
    enableGST: true
  })

  useEffect(() => {
    fetchInitialData()
  }, [id])

  const fetchInitialData = async () => {
    setInitialLoading(true)
    try {
      const [proposalRes, customersRes, productsRes, companyRes] = await Promise.all([
        proposalService.getProposal(id),
        customerService.getCustomers(),
        productService.getProducts({ limit: 1000 }),
        companyService.getCompanySettings()
      ])
      
      if (proposalRes.success) {
        const proposal = proposalRes.data
        setFormData({
          customer: proposal.customer?._id || proposal.customer,
          proposalDate: proposal.proposalDate ? new Date(proposal.proposalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          validUntil: proposal.validUntil ? new Date(proposal.validUntil).toISOString().split('T')[0] : '',
          projectTitle: proposal.projectTitle || '',
          projectSubtitle: proposal.projectSubtitle || '',
          projectDescription: proposal.projectDescription || '',
          objectives: proposal.objectives || '',
          proposedSolution: proposal.proposedSolution || '',
          scopeOfWork: proposal.scopeOfWork || [],
          deliverables: proposal.deliverables || [],
          technologyStack: proposal.technologyStack || [],
          timeline: proposal.timeline || { startDate: '', estimatedCompletionDate: '', duration: '', milestones: [] },
          paymentTerms: proposal.paymentTerms || '50% Advance, 50% on Completion',
          paymentSchedule: (proposal.paymentSchedule || []).map(payment => ({ ...payment, dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '' })),
          advanceAmount: proposal.advanceAmount || 0,
          termsAndConditions: proposal.termsAndConditions || DEFAULT_TERMS.join('\n'),
          notes: proposal.notes || '',
          internalNotes: proposal.internalNotes || '',
          preparedBy: proposal.preparedBy || '',
          items: proposal.items || [],
          enableGST: true
        })
      }
      
      if (customersRes.success) setCustomers(customersRes.data.items || customersRes.data)
      if (productsRes.success) setProducts(productsRes.data.items || productsRes.data)
      if (companyRes.success) {
        setCompanySettings(companyRes.data)
      }
    } catch (error) {
      toast.error('Failed to load initial data')
    } finally {
      setInitialLoading(false)
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
          gstRate: 18,
          isCustom: false,
          customName: '',
          customDescription: ''
        }
      ]
    }))
  }

  const addCustomItem = () => {
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
          gstRate: 18,
          isCustom: true,
          customName: '',
          customDescription: ''
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
            gstRate: 18
          }
        }
      }
      
      return { ...prev, items: newItems }
    })
  }

  const addScopeOfWorkItem = () => {
    setFormData(prev => ({
      ...prev,
      scopeOfWork: [
        ...prev.scopeOfWork,
        { title: '', description: '', bulletPoints: [] }
      ]
    }))
  }

  const removeScopeOfWorkItem = (index) => {
    setFormData(prev => ({
      ...prev,
      scopeOfWork: prev.scopeOfWork.filter((_, i) => i !== index)
    }))
  }

  const updateScopeOfWorkItem = (index, field, value) => {
    setFormData(prev => {
      const newScopeOfWork = [...prev.scopeOfWork]
      newScopeOfWork[index] = { ...newScopeOfWork[index], [field]: value }
      return { ...prev, scopeOfWork: newScopeOfWork }
    })
  }

  const addDeliverableItem = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [
        ...prev.deliverables,
        { name: '', description: '', quantity: 1, notes: '' }
      ]
    }))
  }

  const removeDeliverableItem = (index) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const updateDeliverableItem = (index, field, value) => {
    setFormData(prev => {
      const newDeliverables = [...prev.deliverables]
      newDeliverables[index] = { ...newDeliverables[index], [field]: value }
      return { ...prev, deliverables: newDeliverables }
    })
  }

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: [
          ...prev.timeline.milestones,
          { title: '', description: '', expectedDate: '', duration: '' }
        ]
      }
    }))
  }

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: prev.timeline.milestones.filter((_, i) => i !== index)
      }
    }))
  }

  const updateMilestone = (index, field, value) => {
    setFormData(prev => {
      const newMilestones = [...prev.timeline.milestones]
      newMilestones[index] = { ...newMilestones[index], [field]: value }
      return { 
        ...prev, 
        timeline: { ...prev.timeline, milestones: newMilestones }
      }
    })
  }

  const addTechnology = () => {
    setShowTechModal(true)
    setNewTechnology('')
  }

  const handleAddTechnology = () => {
    if (newTechnology && newTechnology.trim()) {
      setFormData(prev => ({
        ...prev,
        technologyStack: [...prev.technologyStack, newTechnology.trim()]
      }))
      setShowTechModal(false)
      setNewTechnology('')
    }
  }

  const removeTechnology = (index) => {
    setFormData(prev => ({
      ...prev,
      technologyStack: prev.technologyStack.filter((_, i) => i !== index)
    }))
  }

  const handleCustomerChange = (customerId) => {
    setFormData(prev => ({ ...prev, customer: customerId }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.customer) {
      toast.error('Please select a customer')
      return
    }
    
    if (!formData.projectTitle) {
      toast.error('Please enter a project title')
      return
    }
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }
    
    setLoading(true)
    try {
      const response = await proposalService.updateProposal(id, formData)
      if (response.success) {
        toast.success('Proposal updated successfully')
        navigate(`/proposals/${id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update proposal')
    } finally {
      setLoading(false)
    }
  }

  const calculations = useMemo(() => calculateInvoiceTotals(formData.items, 0, 'fixed', formData.enableGST), [formData.items, formData.enableGST])

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Proposal</h1>
          <p className="text-gray-600">Update the proposal details below</p>
        </div>
        <button
          onClick={() => navigate(`/proposals/${id}`)}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={formData.customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="input"
                required
              >
                <option value="">Select Client</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Proposal Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Proposal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Date *
              </label>
              <input
                type="date"
                value={formData.proposalDate}
                onChange={(e) => setFormData(prev => ({ ...prev, proposalDate: e.target.value }))}
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
                Prepared By
              </label>
              <input
                type="text"
                value={formData.preparedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, preparedBy: e.target.value }))}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.projectTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Subtitle
              </label>
              <input
                type="text"
                value={formData.projectSubtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, projectSubtitle: e.target.value }))}
                className="input"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                rows={3}
                className="input"
                placeholder="Provide a brief description of the project..."
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Objectives
              </label>
              <textarea
                value={formData.objectives}
                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                rows={3}
                className="input"
                placeholder="What are the main objectives of this project?"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Solution
              </label>
              <textarea
                value={formData.proposedSolution}
                onChange={(e) => setFormData(prev => ({ ...prev, proposedSolution: e.target.value }))}
                rows={3}
                className="input"
                placeholder="Describe your proposed solution..."
              />
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Scope of Work</h2>
            <button
              type="button"
              onClick={addScopeOfWorkItem}
              className="btn bg-black text-white flex items-center gap-2"
            >
              <FiPlus size={20} />
              Add Scope Item
            </button>
          </div>

          {formData.scopeOfWork.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scope items added yet</p>
          ) : (
            <div className="space-y-4">
              {formData.scopeOfWork.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateScopeOfWorkItem(index, 'title', e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeScopeOfWorkItem(index)}
                        className="btn btn-danger w-max"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateScopeOfWorkItem(index, 'description', e.target.value)}
                        rows={2}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Deliverables</h2>
            <button
              type="button"
              onClick={addDeliverableItem}
              className="btn bg-black text-white flex items-center gap-2"
            >
              <FiPlus size={20} />
              Add Deliverable
            </button>
          </div>

          {formData.deliverables.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No deliverables added yet</p>
          ) : (
            <div className="space-y-4">
              {formData.deliverables.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateDeliverableItem(index, 'name', e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateDeliverableItem(index, 'quantity', Number(e.target.value) || 1)}
                        min="1"
                        className="input"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeDeliverableItem(index)}
                        className="btn btn-danger w-max"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateDeliverableItem(index, 'description', e.target.value)}
                        rows={2}
                        className="input"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={item.notes}
                        onChange={(e) => updateDeliverableItem(index, 'notes', e.target.value)}
                        rows={1}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technology Stack */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Technology Stack</h2>
            <button
              type="button"
              onClick={addTechnology}
              className="btn bg-black text-white flex items-center gap-2"
            >
              <FiPlus size={20} />
              Add Technology
            </button>
          </div>

          {formData.technologyStack.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No technologies added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {formData.technologyStack.map((tech, index) => (
                <div key={index} className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeTechnology(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.timeline.startDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  timeline: { ...prev.timeline, startDate: e.target.value }
                }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Completion Date
              </label>
              <input
                type="date"
                value={formData.timeline.estimatedCompletionDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  timeline: { ...prev.timeline, estimatedCompletionDate: e.target.value }
                }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <input
                type="text"
                value={formData.timeline.duration}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  timeline: { ...prev.timeline, duration: e.target.value }
                }))}
                className="input"
                placeholder="e.g., 3 months"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">Milestones</h3>
              <button
                type="button"
                onClick={addMilestone}
                className="btn bg-black text-white flex items-center gap-2 text-sm"
              >
                <FiPlus size={16} />
                Add Milestone
              </button>
            </div>

            {formData.timeline.milestones.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No milestones added yet</p>
            ) : (
              <div className="space-y-3">
                {formData.timeline.milestones.map((milestone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Date
                        </label>
                        <input
                          type="date"
                          value={milestone.expectedDate}
                          onChange={(e) => updateMilestone(index, 'expectedDate', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="btn btn-danger w-max"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          rows={1}
                          className="input"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={milestone.duration}
                          onChange={(e) => updateMilestone(index, 'duration', e.target.value)}
                          className="input"
                          placeholder="e.g., 2 weeks"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products/Services */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Products / Services</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addItem}
                className="btn bg-black text-white flex items-center gap-2"
              >
                <FiPlus size={20} />
                Add Product
              </button>
              <button
                type="button"
                onClick={addCustomItem}
                className="btn bg-gray-700 text-white flex items-center gap-2"
              >
                <FiPlus size={20} />
                Add Custom Item
              </button>
            </div>
          </div>

          {formData.items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet</p>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {item.isCustom ? (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Item Name *
                        </label>
                        <input
                          type="text"
                          value={item.customName}
                          onChange={(e) => updateItem(index, 'customName', e.target.value)}
                          className="input"
                          required
                        />
                      </div>
                    ) : (
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
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range
                      </label>
                      <select
                        value={item.priceRange || 'standard'}
                        onChange={(e) => updateItem(index, 'priceRange', e.target.value)}
                        className="input"
                        disabled={item.isCustom}
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

                    {item.isCustom && (
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Description
                        </label>
                        <textarea
                          value={item.customDescription}
                          onChange={(e) => updateItem(index, 'customDescription', e.target.value)}
                          rows={2}
                          className="input"
                        />
                      </div>
                    )}

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn btn-danger w-max"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>

                    <div className="md:col-span-5">
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

                    <div className="md:col-span-6">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculations.itemDiscount + calculations.invoiceDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatCurrency(calculations.totalTax)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(calculations.finalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Terms */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className="input"
              >
                {PAYMENT_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount
              </label>
              <input
                type="number"
                value={formData.advanceAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: Number(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Payment Schedule (optional)</label>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, paymentSchedule: [...prev.paymentSchedule, { stage: '', percentage: 0, amount: 0, dueDate: '' }] }))} className="text-sm text-primary-600 font-medium">+ Add Stage</button>
              </div>
              {formData.paymentSchedule.map((payment, index) => (
                <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <input value={payment.stage} onChange={e => setFormData(prev => { const schedule = [...prev.paymentSchedule]; schedule[index] = { ...schedule[index], stage: e.target.value }; return { ...prev, paymentSchedule: schedule } })} placeholder="Stage" className="input md:col-span-2" />
                  <input type="number" value={payment.percentage} onChange={e => setFormData(prev => { const schedule = [...prev.paymentSchedule]; schedule[index] = { ...schedule[index], percentage: Number(e.target.value) || 0 }; return { ...prev, paymentSchedule: schedule } })} placeholder="%" className="input" />
                  <input type="number" value={payment.amount} onChange={e => setFormData(prev => { const schedule = [...prev.paymentSchedule]; schedule[index] = { ...schedule[index], amount: Number(e.target.value) || 0 }; return { ...prev, paymentSchedule: schedule } })} placeholder="Amount" className="input" />
                  <input type="date" value={payment.dueDate} onChange={e => setFormData(prev => { const schedule = [...prev.paymentSchedule]; schedule[index] = { ...schedule[index], dueDate: e.target.value }; return { ...prev, paymentSchedule: schedule } })} className="input" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                rows={4}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="input"
                placeholder="Any additional notes for the client..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Not visible to client)
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                rows={3}
                className="input"
                placeholder="Internal notes for your team..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn bg-black text-white flex items-center gap-2"
          >
            <FiSave size={20} />
            {loading ? 'Updating...' : 'Update Proposal'}
          </button>
        </div>
      </form>

      {/* Technology Modal */}
      <Modal
        isOpen={showTechModal}
        onClose={() => setShowTechModal(false)}
        title="Add Technology"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technology Name
            </label>
            <input
              type="text"
              value={newTechnology}
              onChange={(e) => setNewTechnology(e.target.value)}
              className="input"
              placeholder="e.g., React.js"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTechnology()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowTechModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTechnology}
              disabled={!newTechnology.trim()}
              className="btn btn-primary"
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProposalEditPage