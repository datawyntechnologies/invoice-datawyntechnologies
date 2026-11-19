import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import QuotationForm from '../../components/quotations/QuotationForm'
import { quotationService } from '../../services/quotationService'

const QuotationEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await quotationService.getQuotation(id)
        if (response.success) {
          setQuotation(response.data)
        }
      } catch (error) {
        toast.error('Failed to fetch quotation')
        navigate('/quotations')
      } finally {
        setLoading(false)
      }
    }
    fetchQuotation()
  }, [id, navigate])

  const handleSubmit = async (data) => {
    setSubmitting(true)
    try {
      const response = await quotationService.updateQuotation(id, data)
      if (response.success) {
        toast.success('Quotation updated successfully')
        navigate(`/quotations/${id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quotation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Quotation not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Quotation</h1>
        <p className="text-gray-600">{quotation.quotationNumber} — {quotation.projectName}</p>
      </div>
      <QuotationForm initialData={quotation} onSubmit={handleSubmit} submitting={submitting} submitLabel="Update Quotation" />
    </div>
  )
}

export default QuotationEditPage
