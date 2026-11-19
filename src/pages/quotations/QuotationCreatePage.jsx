import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import QuotationForm from '../../components/quotations/QuotationForm'
import { quotationService } from '../../services/quotationService'

const QuotationCreatePage = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data) => {
    setSubmitting(true)
    try {
      const response = await quotationService.createQuotation(data)
      if (response.success) {
        toast.success('Quotation created successfully')
        navigate(`/quotations/${response.data._id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quotation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Quotation</h1>
        <p className="text-gray-600">Create a new quotation for a client</p>
      </div>
      <QuotationForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create Quotation" />
    </div>
  )
}

export default QuotationCreatePage
