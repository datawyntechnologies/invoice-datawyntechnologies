import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { companyService } from '../services/companyService'

const CompanyContext = createContext(null)

export const CompanyProvider = ({ children }) => {
  const [companySettings, setCompanySettings] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCompanySettings = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      // Use public endpoint if no token, authenticated endpoint if token exists
      const response = token
        ? await companyService.getCompanySettings()
        : await companyService.getPublicCompanySettings()
      if (response.success) {
        setCompanySettings(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanySettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(() => ({
    companySettings,
    loading,
    refreshCompany: fetchCompanySettings,
  }), [companySettings, loading, fetchCompanySettings])

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
