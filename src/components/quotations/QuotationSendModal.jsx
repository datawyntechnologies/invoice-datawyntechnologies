import { useEffect, useState } from 'react'
import { FiX, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { quotationService } from '../../services/quotationService'

const defaultMessage = (quotation) => `Dear ${quotation.customerSnapshot?.contactPerson || quotation.customerSnapshot?.companyName || 'Client'},\n\nGreetings from Datawyn Technologies!\n\nPlease find attached the quotation for your requested project.\n\nThe attached document contains the project scope, deliverables, estimated timeline, pricing and payment terms.\n\nKindly review the quotation and let us know if you have any questions or require any modifications.\n\nWe look forward to working with you.\n\nBest Regards,\nDatawyn Technologies\nDigital Solutions That Build And Scale`

const QuotationSendModal = ({ quotation, onClose, onSent }) => {
  const [email, setEmail] = useState(quotation.customerSnapshot?.email || quotation.email || '')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(`Quotation for ${quotation.projectName} – ${quotation.quotationNumber}`)
  const [message, setMessage] = useState(defaultMessage(quotation))
  const [sending, setSending] = useState(false)

  const sendEmail = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error('A valid recipient email is required')
    }
    setSending(true)
    try {
      const response = await quotationService.sendQuotation(quotation._id, {
        email,
        cc: cc || undefined,
        subject,
        message
      })
      if (response.success) {
        toast.success('Quotation email sent successfully')
        onSent?.()
        onClose()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send quotation email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Send Quotation</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CC (optional)</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="input"
              placeholder="cc@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input h-44"
            />
          </div>
          <p className="text-xs text-gray-500">
            The quotation PDF will be generated from the latest saved data and attached automatically.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary" disabled={sending}>
            Cancel
          </button>
          <button onClick={sendEmail} disabled={sending} className="btn btn-primary flex items-center gap-2">
            <FiSend size={16} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuotationSendModal
