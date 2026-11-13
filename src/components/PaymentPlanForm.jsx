import { useState, useEffect, useMemo } from 'react'
import { FiPlus, FiTrash2, FiInfo, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/dateUtils'

const PaymentPlanForm = ({ totalAmount, invoiceDate, onChange, existingPlan, disableEdit = false }) => {
  const [planType, setPlanType] = useState(existingPlan?.planType || '')
  const [paymentMethod, setPaymentMethod] = useState(existingPlan?.paymentMethod || '')
  const [paymentSchedule, setPaymentSchedule] = useState(existingPlan?.paymentSchedule || [])
  const [emiDetails, setEmiDetails] = useState(existingPlan?.emiDetails || {})
  const [recurringDetails, setRecurringDetails] = useState(existingPlan?.recurringDetails || {})
  const [balanceDueDate, setBalanceDueDate] = useState(existingPlan?.balanceDueDate || '')
  const [validationError, setValidationError] = useState('')

  // Extract balanceDueDate from payment schedule for advance_50 plans
  useEffect(() => {
    if (existingPlan?.planType === 'advance_50' && existingPlan?.paymentSchedule?.length >= 2) {
      const balancePayment = existingPlan.paymentSchedule.find(p => p.paymentType === 'balance')
      if (balancePayment?.dueDate) {
        setBalanceDueDate(balancePayment.dueDate.split('T')[0])
      }
    }
  }, [existingPlan])

  useEffect(() => {
    // Notify parent of changes
    const planData = {
      planType,
      paymentMethod,
      paymentSchedule,
      emiDetails,
      recurringDetails,
      balanceDueDate,
    }

    // Only send if we have a valid plan type and the required data
    if (planType) {
      console.log('PaymentPlanForm - sending data to parent:', planData)
      onChange(planData)
    } else {
      // Send null if no plan type selected
      console.log('PaymentPlanForm - sending null to parent (no plan type)')
      onChange(null)
    }
  }, [planType, paymentMethod, paymentSchedule, emiDetails, recurringDetails, balanceDueDate, onChange])

  const addPaymentStage = () => {
    setPaymentSchedule([
      ...paymentSchedule,
      {
        paymentName: `Payment ${paymentSchedule.length + 1}`,
        paymentType: 'milestone',
        amount: 0,
        percentage: 0,
        dueDate: '',
      }
    ])
  }

  const updatePaymentStage = (index, field, value) => {
    const updated = [...paymentSchedule]
    updated[index] = { ...updated[index], [field]: value }
    setPaymentSchedule(updated)
  }

  const removePaymentStage = (index) => {
    setPaymentSchedule(paymentSchedule.filter((_, i) => i !== index))
  }

  const calculateEMI = () => {
    if (!emiDetails.numberOfMonths || !totalAmount) return 0
    return Math.floor(totalAmount / emiDetails.numberOfMonths)
  }

  const validateSchedule = () => {
    if (!planType) return false
    
    if (planType === 'full_payment') {
      return true
    }
    
    if (planType === 'advance_50') {
      return true
    }
    
    if (planType === 'custom_fixed') {
      const totalScheduled = paymentSchedule.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
      if (Math.abs(totalScheduled - totalAmount) > 0.01) {
        setValidationError(`Total scheduled amount (₹${totalScheduled}) must equal invoice amount (₹${totalAmount})`)
        return false
      }
    }
    
    if (planType === 'custom_percentage') {
      const totalPercentage = paymentSchedule.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setValidationError(`Total percentage (${totalPercentage}%) must equal 100%`)
        return false
      }
    }
    
    if (planType === 'emi') {
      if (!emiDetails.numberOfMonths || emiDetails.numberOfMonths < 1) {
        setValidationError('Number of months is required')
        return false
      }
    }

    if (planType === 'recurring') {
      if (!recurringDetails.amount || recurringDetails.amount <= 0) {
        setValidationError('Recurring payment amount is required')
        return false
      }
      if (!['monthly', 'quarterly', 'yearly'].includes(recurringDetails.frequency)) {
        setValidationError('Please select a payment frequency')
        return false
      }
      if (!recurringDetails.startDate || !recurringDetails.endDate) {
        setValidationError('Service start date and due date are required')
        return false
      }
      if (new Date(recurringDetails.startDate) > new Date(recurringDetails.endDate)) {
        setValidationError('Service start date cannot be after the due date')
        return false
      }
    }

    setValidationError('')
    return true
  }

  // Generate payment schedule preview
  const previewSchedule = useMemo(() => {
    if (!planType || !totalAmount) return []

    switch (planType) {
      case 'full_payment':
        return [{
          paymentName: 'Full Payment',
          paymentType: 'other',
          amount: totalAmount,
          percentage: 100,
          dueDate: invoiceDate || new Date(),
          status: 'pending'
        }]

      case 'advance_50':
        const advanceAmount = totalAmount * 0.5
        return [
          {
            paymentName: 'Advance Payment',
            paymentType: 'advance',
            amount: advanceAmount,
            percentage: 50,
            dueDate: invoiceDate || new Date(),
            status: 'pending'
          },
          {
            paymentName: 'Remaining Balance',
            paymentType: 'balance',
            amount: advanceAmount,
            percentage: 50,
            dueDate: balanceDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        ]

      case 'custom_payment':
        if (paymentMethod === 'fixed_amount') {
          return paymentSchedule.map((item, index) => ({
            paymentName: item.paymentName || `Payment ${index + 1}`,
            paymentType: item.paymentType || 'milestone',
            amount: item.amount,
            percentage: null,
            dueDate: item.dueDate,
            status: 'pending'
          }))
        }

        if (paymentMethod === 'percentage_based') {
          return paymentSchedule.map((item, index) => ({
            paymentName: item.paymentName || `Payment ${index + 1}`,
            paymentType: item.paymentType || 'milestone',
            amount: (totalAmount * (item.percentage || 0)) / 100,
            percentage: item.percentage,
            dueDate: item.dueDate,
            status: 'pending'
          }))
        }

        if (paymentMethod === 'emi') {
          const { numberOfMonths, startDate, paymentDay } = emiDetails
          if (!numberOfMonths || numberOfMonths < 1) return []

          const monthlyAmount = Math.floor(totalAmount / numberOfMonths)
          const remainder = totalAmount - (monthlyAmount * (numberOfMonths - 1))
          const start = new Date(startDate || new Date())

          const schedule = []
          for (let i = 0; i < numberOfMonths; i++) {
            const dueDate = new Date(start)
            dueDate.setMonth(dueDate.getMonth() + i)

            if (paymentDay && paymentDay >= 1 && paymentDay <= 31) {
              dueDate.setDate(paymentDay)
            }

            const amount = i === numberOfMonths - 1 ? remainder : monthlyAmount

            schedule.push({
              paymentName: `EMI Installment ${i + 1}`,
              paymentType: 'emi',
              amount: amount,
              percentage: null,
              dueDate: dueDate,
              status: 'pending'
            })
          }

          return schedule
        }

        return []

      case 'recurring': {
        const { amount, frequency, startDate, endDate } = recurringDetails
        if (!amount || amount <= 0 || !frequency || !startDate || !endDate) return []

        const monthsStep = { monthly: 1, quarterly: 3, yearly: 12 }[frequency]
        const frequencyLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1)
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (isNaN(start) || isNaN(end) || start > end) return []

        const schedule = []
        const current = new Date(start)
        let guard = 0
        while (current <= end && guard < 1000) {
          schedule.push({
            paymentName: `${frequencyLabel} Payment`,
            paymentType: 'recurring',
            amount,
            percentage: null,
            dueDate: new Date(current),
            status: 'pending'
          })
          current.setMonth(current.getMonth() + monthsStep)
          guard++
        }
        return schedule
      }

      default:
        return []
    }
  }, [planType, paymentMethod, paymentSchedule, emiDetails, recurringDetails, balanceDueDate, totalAmount, invoiceDate])

  // Calculate summary
  const summary = useMemo(() => {
    const totalScheduled = previewSchedule.reduce((sum, item) => sum + (item.amount || 0), 0)
    const totalPaid = 0 // Will be 0 for new plans
    const remaining = totalScheduled - totalPaid

    return {
      invoiceAmount: totalAmount,
      totalScheduled,
      totalPaid,
      remaining,
      isValid: Math.abs(totalScheduled - totalAmount) < 0.01
    }
  }, [previewSchedule, totalAmount])

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FiCheckCircle className="text-green-600" />
      case 'partial':
        return <FiClock className="text-yellow-600" />
      case 'overdue':
        return <FiAlertCircle className="text-red-600" />
      default:
        return <FiClock className="text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Plan</h3>
          {disableEdit && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Payment plan cannot be edited after payments have been made
            </span>
          )}
        </div>

        {/* Payment Plan Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Plan Type
          </label>
          <select
            value={planType}
            onChange={(e) => {
              console.log('PaymentPlanForm - planType changed to:', e.target.value)
              setPlanType(e.target.value)
              setPaymentMethod('')
              setPaymentSchedule([])
              setEmiDetails({})
              setRecurringDetails({})
              setBalanceDueDate('')
              setValidationError('')
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={disableEdit}
          >
            <option value="">Select Payment Plan</option>
            <option value="full_payment">Full Payment</option>
            <option value="advance_50">50% Advance</option>
            <option value="custom_payment">Custom Payment Plan</option>
            <option value="recurring">Recurring Payment</option>
          </select>
        </div>

        {/* Full Payment */}
        {planType === 'full_payment' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <FiInfo />
              <span>Full payment of ₹{totalAmount?.toLocaleString()} will be due on invoice date</span>
            </div>
            <div className="text-sm">
              <p><strong>Payment 1:</strong> ₹{totalAmount?.toLocaleString()}</p>
              <p><strong>Due Date:</strong> {invoiceDate ? new Date(invoiceDate).toLocaleDateString() : 'Invoice Date'}</p>
            </div>
          </div>
        )}

        {/* 50% Advance */}
        {planType === 'advance_50' && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="text-sm">
              <p><strong>Advance Payment:</strong> ₹{(totalAmount * 0.5).toLocaleString()}</p>
              <p><strong>Remaining Balance:</strong> ₹{(totalAmount * 0.5).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balance Due Date
              </label>
              <input
                type="date"
                value={balanceDueDate}
                onChange={(e) => setBalanceDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                disabled={disableEdit}
              />
            </div>
          </div>
        )}

        {/* Recurring Payment */}
        {planType === 'recurring' && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiInfo />
              <span>Creates a recurring payment of the entered amount at the selected frequency from the service start date until the due date</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={recurringDetails.amount || ''}
                  onChange={(e) => setRecurringDetails({ ...recurringDetails, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 2000"
                  min="0"
                  disabled={disableEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={recurringDetails.frequency || ''}
                  onChange={(e) => setRecurringDetails({ ...recurringDetails, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={disableEdit}
                >
                  <option value="">Select Frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Start Date
                </label>
                <input
                  type="date"
                  value={recurringDetails.startDate || ''}
                  onChange={(e) => setRecurringDetails({ ...recurringDetails, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={disableEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={recurringDetails.endDate || ''}
                  onChange={(e) => setRecurringDetails({ ...recurringDetails, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={disableEdit}
                />
              </div>
            </div>
          </div>
        )}

        {/* Custom Payment Plan */}
        {planType === 'custom_payment' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value)
                  setPaymentSchedule([])
                  setEmiDetails({})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                disabled={disableEdit}
              >
                <option value="">Select Payment Method</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="percentage_based">Percentage-Based Payment</option>
                <option value="emi">EMI</option>
              </select>
            </div>

            {/* Fixed Amount */}
            {paymentMethod === 'fixed_amount' && (
              <div className="space-y-4">
                {paymentSchedule.map((stage, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">Payment {index + 1}</h4>
                      {!disableEdit && (
                        <button
                          type="button"
                          onClick={() => removePaymentStage(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Name
                        </label>
                        <input
                          type="text"
                          value={stage.paymentName}
                          onChange={(e) => updatePaymentStage(index, 'paymentName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., Advance"
                          disabled={disableEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={stage.amount}
                          onChange={(e) => updatePaymentStage(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                          disabled={disableEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={stage.dueDate}
                          onChange={(e) => updatePaymentStage(index, 'dueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          disabled={disableEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Type
                        </label>
                        <select
                          value={stage.paymentType}
                          onChange={(e) => updatePaymentStage(index, 'paymentType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          disabled={disableEdit}
                        >
                          <option value="milestone">Milestone</option>
                          <option value="advance">Advance</option>
                          <option value="balance">Balance</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={stage.notes || ''}
                        onChange={(e) => updatePaymentStage(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        rows="2"
                        placeholder="Optional notes for this payment"
                        disabled={disableEdit}
                      />
                    </div>
                  </div>
                ))}
                {!disableEdit && (
                  <button
                    type="button"
                    onClick={addPaymentStage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600"
                  >
                    <FiPlus />
                    Add Payment Stage
                  </button>
                )}
                <div className="text-sm text-gray-600">
                  <p><strong>Total Scheduled:</strong> ₹{paymentSchedule.reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString()}</p>
                  <p><strong>Invoice Amount:</strong> ₹{totalAmount?.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Percentage-Based */}
            {paymentMethod === 'percentage_based' && (
              <div className="space-y-4">
                {paymentSchedule.map((stage, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">Payment {index + 1}</h4>
                      {!disableEdit && (
                        <button
                          type="button"
                          onClick={() => removePaymentStage(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Name
                        </label>
                        <input
                          type="text"
                          value={stage.paymentName}
                          onChange={(e) => updatePaymentStage(index, 'paymentName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., Advance"
                          disabled={disableEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Percentage (%)
                        </label>
                        <input
                          type="number"
                          value={stage.percentage}
                          onChange={(e) => updatePaymentStage(index, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                          min="0"
                          max="100"
                          disabled={disableEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={stage.dueDate}
                          onChange={(e) => updatePaymentStage(index, 'dueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          disabled={disableEdit}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Calculated Amount
                        </label>
                        <input
                          type="text"
                          value={`₹${((totalAmount * (stage.percentage || 0)) / 100).toLocaleString()}`}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {!disableEdit && (
                  <button
                    type="button"
                    onClick={addPaymentStage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600"
                  >
                    <FiPlus />
                    Add Payment Stage
                  </button>
                )}
                <div className="text-sm text-gray-600">
                  <p><strong>Total Percentage:</strong> {paymentSchedule.reduce((sum, s) => sum + (s.percentage || 0), 0)}%</p>
                  <p><strong>Total Amount:</strong> ₹{paymentSchedule.reduce((sum, s) => sum + ((totalAmount * (s.percentage || 0)) / 100), 0).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* EMI */}
            {paymentMethod === 'emi' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Months
                    </label>
                    <input
                      type="number"
                      value={emiDetails.numberOfMonths || ''}
                      onChange={(e) => setEmiDetails({ ...emiDetails, numberOfMonths: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 6"
                      min="1"
                      disabled={disableEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={emiDetails.startDate || ''}
                      onChange={(e) => setEmiDetails({ ...emiDetails, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={disableEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Day (1-31)
                    </label>
                    <input
                      type="number"
                      value={emiDetails.paymentDay || ''}
                      onChange={(e) => setEmiDetails({ ...emiDetails, paymentDay: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 5"
                      min="1"
                      max="31"
                      disabled={disableEdit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly EMI
                    </label>
                    <input
                      type="text"
                      value={`₹${calculateEMI().toLocaleString()}`}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {validationError}
          </div>
        )}

        {/* Payment Schedule Preview */}
        {previewSchedule.length > 0 && (
          <div className="card bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule Preview</h3>
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Invoice Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.invoiceAmount)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Total Scheduled</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalScheduled)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.remaining)}</p>
              </div>
            </div>

            {/* Validation Status */}
            {!summary.isValid && planType !== 'recurring' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
                ⚠️ Total scheduled amount ({formatCurrency(summary.totalScheduled)}) does not match invoice amount ({formatCurrency(summary.invoiceAmount)})
              </div>
            )}

            {/* Schedule Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewSchedule.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{payment.paymentName}</div>
                        {payment.percentage && (
                          <div className="text-xs text-gray-500">{payment.percentage}%</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {payment.dueDate ? formatDate(payment.dueDate) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(payment.status)}
                          <span className="text-sm capitalize">{payment.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentPlanForm
