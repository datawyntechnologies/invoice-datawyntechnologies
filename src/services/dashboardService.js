import api from './api'

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  getCharts: async () => {
    const response = await api.get('/dashboard/charts')
    return response.data
  },

  getRevenueChart: async ({ startDate, endDate, groupBy } = {}) => {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (groupBy) params.groupBy = groupBy
    const response = await api.get('/dashboard/revenue-chart', { params })
    return response.data
  },
}
