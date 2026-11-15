import api from './api'

export const proposalThemeService = {
  getThemes: async () => (await api.get('/proposal-themes')).data,
  getTheme: async (id) => (await api.get(`/proposal-themes/${id}`)).data,
  createTheme: async (data) => (await api.post('/proposal-themes', data)).data,
  updateTheme: async (id, data) => (await api.put(`/proposal-themes/${id}`, data)).data,
  deleteTheme: async (id) => (await api.delete(`/proposal-themes/${id}`)).data
}
