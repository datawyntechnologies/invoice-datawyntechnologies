import api from './api'

export const proposalService = {
  getProposals: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/proposals?${queryParams}`)
    return response.data
  },

  getProposal: async (id) => {
    const response = await api.get(`/proposals/${id}`)
    return response.data
  },

  createProposal: async (data) => {
    const response = await api.post('/proposals', data)
    return response.data
  },

  updateProposal: async (id, data) => {
    const response = await api.put(`/proposals/${id}`, data)
    return response.data
  },

  deleteProposal: async (id) => {
    const response = await api.delete(`/proposals/${id}`)
    return response.data
  },

  duplicateProposal: async (id) => {
    const response = await api.post(`/proposals/${id}/duplicate`)
    return response.data
  },

  updateProposalStatus: async (id, status) => {
    const response = await api.patch(`/proposals/${id}/status`, { status })
    return response.data
  },

  downloadPDF: async (id, themeId) => {
    const response = await api.get(`/proposals/${id}/pdf`, {
      responseType: 'blob',
      params: themeId ? { themeId } : {}
    })
    return response
  },

  generatePDF: async (id, themeId) => {
    const response = await api.post(`/proposals/${id}/pdf`, { themeId })
    return response.data
  },

  sendProposal: async (id, data) => {
    const response = await api.post(`/proposals/${id}/send`, data)
    return response.data
  },

  createShareLink: async (id, expiresInDays = 30) => {
    const response = await api.post(`/proposals/${id}/share-link`, { expiresInDays })
    return response.data
  },

  revokeShareLink: async (id) => {
    const response = await api.delete(`/proposals/${id}/share-link`)
    return response.data
  }
}
