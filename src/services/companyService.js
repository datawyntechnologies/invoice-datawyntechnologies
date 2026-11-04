import api from './api'

export const companyService = {
  getCompanySettings: async () => {
    const response = await api.get('/company')
    return response.data
  },

  getPublicCompanySettings: async () => {
    const response = await api.get('/company/public')
    return response.data
  },

  updateCompanySettings: async (settingsData, logoFile, signatureFile) => {
    const formData = new FormData()
    
    // Append all settings data
    Object.keys(settingsData).forEach(key => {
      if (typeof settingsData[key] === 'object' && settingsData[key] !== null) {
        formData.append(key, JSON.stringify(settingsData[key]))
      } else {
        formData.append(key, settingsData[key])
      }
    })
    
    // Append logo file if provided
    if (logoFile) {
      formData.append('logo', logoFile)
    }
    
    // Append signature file if provided
    if (signatureFile) {
      formData.append('signature', signatureFile)
    }
    
    const response = await api.put('/company', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
}
