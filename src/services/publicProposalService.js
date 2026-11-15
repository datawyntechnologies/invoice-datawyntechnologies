import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const publicApi = axios.create({ baseURL: API_URL })

export const publicProposalService = {
  getProposal: async (token) => (await publicApi.get(`/public/proposals/${token}`)).data,
  downloadPDF: async (token) => {
    const response = await publicApi.get(`/public/proposals/${token}/pdf`, { responseType: 'blob' })
    return response
  },
  respond: async (token, action, data = {}) => (await publicApi.post(`/public/proposals/${token}/${action}`, data)).data
}
