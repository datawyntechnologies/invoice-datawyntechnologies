import api from './api'

export const customerService = {
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params })
    return response.data
  },

  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`)
    return response.data
  },

  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData)
    return response.data
  },

  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData)
    return response.data
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`)
    return response.data
  },

  getCustomerInvoices: async (id) => {
    const response = await api.get(`/customers/${id}/invoices`)
    return response.data
  },

  importCustomers: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/customers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
}
