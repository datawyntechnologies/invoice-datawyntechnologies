import api from './api'

export const customerTypeService = {
  getCustomerTypes: async () => {
    const response = await api.get('/customer-types')
    return response.data
  },

  createCustomerType: async (name) => {
    const response = await api.post('/customer-types', { name })
    return response.data
  },

  updateCustomerType: async (id, name) => {
    const response = await api.put(`/customer-types/${id}`, { name })
    return response.data
  },

  deleteCustomerType: async (id) => {
    const response = await api.delete(`/customer-types/${id}`)
    return response.data
  },
}
