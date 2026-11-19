import api from './api'

export const quotationService = {
  getQuotations: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/quotations?${queryParams}`)
    return response.data
  },

  getQuotationStats: async () => {
    const response = await api.get('/quotations/stats')
    return response.data
  },

  getQuotation: async (id) => {
    const response = await api.get(`/quotations/${id}`)
    return response.data
  },

  createQuotation: async (data) => {
    const response = await api.post('/quotations', data)
    return response.data
  },

  updateQuotation: async (id, data) => {
    const response = await api.put(`/quotations/${id}`, data)
    return response.data
  },

  deleteQuotation: async (id) => {
    const response = await api.delete(`/quotations/${id}`)
    return response.data
  },

  duplicateQuotation: async (id) => {
    const response = await api.post(`/quotations/${id}/duplicate`)
    return response.data
  },

  updateQuotationStatus: async (id, status, notes) => {
    const response = await api.patch(`/quotations/${id}/status`, { status, notes })
    return response.data
  },

  downloadPDF: async (id) => {
    const response = await api.get(`/quotations/${id}/pdf`, {
      responseType: 'blob'
    })
    return response
  },

  sendQuotation: async (id, data) => {
    const response = await api.post(`/quotations/${id}/send-email`, data)
    return response.data
  }
}
