import api from './api'

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData)
    return response.data
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  importProducts: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
}
