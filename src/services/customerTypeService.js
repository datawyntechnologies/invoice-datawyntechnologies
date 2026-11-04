import api from './api'

export const customerTypeService = {
  // Get all customer types
  getCustomerTypes: async () => {
    const response = await api.get('/customer-types')
    return response.data
  },

  // Get single customer type
  getCustomerType: async (id) => {
    const response = await api.get(`/customer-types/${id}`)
    return response.data
  },

  // Create customer type
  createCustomerType: async (data) => {
    const response = await api.post('/customer-types', data)
    return response.data
  },

  // Update customer type
  updateCustomerType: async (id, data) => {
    const response = await api.put(`/customer-types/${id}`, data)
    return response.data
  },

  // Delete customer type
  deleteCustomerType: async (id) => {
    const response = await api.delete(`/customer-types/${id}`)
    return response.data
  }
}
