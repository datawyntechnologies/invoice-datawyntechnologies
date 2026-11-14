import api from './api'

export const paymentService = {
  // Create Payment Plan
  createPaymentPlan: async (data) => {
    const response = await api.post('/payments', data)
    return response.data
  },

  // Get Payment Plan by Invoice
  getPaymentPlanByInvoice: async (invoiceType, invoiceId) => {
    const response = await api.get(`/payments/invoice/${invoiceType}/${invoiceId}`)
    return response.data
  },

  // Get All Payment Plans
  getAllPaymentPlans: async () => {
    const response = await api.get('/payments')
    return response.data
  },

  // Record Payment
  recordPayment: async (data) => {
    const response = await api.post('/payments/record', data)
    return response.data
  },

  // Add Manual Installment/Payment Entry
  addManualInstallment: async (data) => {
    const response = await api.post('/payments/installments', data)
    return response.data
  },

  // Import Payment Schedule (xlsx/csv)
  importPaymentSchedule: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/payments/schedule/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Get Payment History
  getPaymentHistory: async (customerId) => {
    const response = await api.get(`/payments/history/${customerId}`)
    return response.data
  },

  // Delete Payment Transaction
  deleteTransaction: async (id) => {
    const response = await api.delete(`/payments/transactions/${id}`)
    return response.data
  },

  // Get Customer Payment Summary
  getCustomerPaymentSummary: async (customerId) => {
    const response = await api.get(`/payments/summary/${customerId}`)
    return response.data
  },

  // Update Payment Plan
  updatePaymentPlan: async (id, data) => {
    const response = await api.put(`/payments/${id}`, data)
    return response.data
  },

  // Delete Payment Plan
  deletePaymentPlan: async (id, force = false) => {
    const response = await api.delete(`/payments/${id}${force ? '?force=true' : ''}`)
    return response.data
  },
}
