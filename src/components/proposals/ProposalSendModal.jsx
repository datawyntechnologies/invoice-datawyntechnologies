import { useEffect, useState } from 'react'
import { FiDownload, FiLink, FiMessageCircle, FiRefreshCw, FiSend, FiShare2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { proposalService } from '../../services/proposalService'
import { proposalThemeService } from '../../services/proposalThemeService'

const defaultMessage = (proposal) => `Dear ${proposal.customerSnapshot?.contactPerson || proposal.customerSnapshot?.companyName || 'Client'},\n\nGreetings from Datawyn Technologies!\n\nPlease find attached our project proposal for ${proposal.projectTitle}.\n\nThe document includes the project overview, objectives, scope of work, deliverables, project timeline, pricing, and payment terms.\n\nKindly review the proposal and let us know if you have any questions or modifications.\n\nWe look forward to working with you.\n\nBest Regards,\nDatawyn Technologies\nDigital Solutions That Build And Scale`

const ProposalSendModal = ({ proposal, onClose, onSent }) => {
  const [themes, setThemes] = useState([])
  const [themeId, setThemeId] = useState('')
  const [email, setEmail] = useState(proposal.customerSnapshot?.email || '')
  const [subject, setSubject] = useState(`Project Proposal – ${proposal.projectTitle} | Datawyn Technologies`)
  const [message, setMessage] = useState(defaultMessage(proposal))
  const [shareUrl, setShareUrl] = useState('')
  const [loadingThemes, setLoadingThemes] = useState(true)
  const [sending, setSending] = useState(false)
  const [creatingLink, setCreatingLink] = useState(false)

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const response = await proposalThemeService.getThemes()
        const items = response.data || []
        setThemes(items)
        setThemeId(items.find(theme => theme.isDefault)?._id || items[0]?._id || '')
      } catch { toast.error('Failed to load proposal themes') }
      finally { setLoadingThemes(false) }
    }
    loadThemes()
  }, [])

  const downloadPDF = async () => {
    try {
      const response = await proposalService.downloadPDF(proposal._id, themeId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const client = proposal.customerSnapshot?.companyName?.replace(/[^a-zA-Z0-9]+/g, '_') || 'Client'
      link.download = `Datawyn_Proposal_${proposal.proposalNumber}_${client}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF preview downloaded')
    } catch { toast.error('Failed to generate PDF preview') }
  }

  const createLink = async () => {
    setCreatingLink(true)
    try {
      const response = await proposalService.createShareLink(proposal._id, 30)
      setShareUrl(response.data.url)
      toast.success('Secure proposal link created')
      onSent?.()
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to create proposal link') }
    finally { setCreatingLink(false) }
  }

  const sendEmail = async () => {
    if (!email) return toast.error('Client email is required')
    setSending(true)
    try {
      const response = await proposalService.sendProposal(proposal._id, { email, subject, message, themeId, expiresInDays: 30 })
      setShareUrl(response.data.shareUrl)
      toast.success('Proposal email sent successfully')
      onSent?.()
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to send proposal email') }
    finally { setSending(false) }
  }

  const shareWhatsApp = () => {
    if (!shareUrl) return toast.error('Create a proposal link first')
    window.open(`https://wa.me/?text=${encodeURIComponent(`Please review our project proposal: ${shareUrl}`)}`, '_blank')
  }

  const copyLink = async () => {
    if (!shareUrl) return toast.error('Create a proposal link first')
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Proposal link copied')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div><h3 className="text-lg font-bold text-gray-900">Send Proposal</h3><p className="text-sm text-gray-500">{proposal.proposalNumber} · {proposal.projectTitle}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label><input value={proposal.customerSnapshot?.companyName || ''} readOnly className="input bg-gray-50" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">PDF Theme</label><select value={themeId} onChange={e => setThemeId(e.target.value)} className="input" disabled={loadingThemes}>{themes.map(theme => <option key={theme._id} value={theme._id}>{theme.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} className="input" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} className="input min-h-40" /></div>
          {shareUrl && <div className="rounded-xl bg-gray-50 border p-4"><label className="text-sm font-medium text-gray-700">Secure Proposal Link</label><div className="flex gap-2 mt-2"><input readOnly value={shareUrl} className="input flex-1" /><button onClick={copyLink} className="btn btn-secondary"><FiLink /></button></div></div>}
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadPDF} className="btn btn-secondary flex items-center gap-2"><FiDownload /> Preview PDF</button>
            <button onClick={createLink} disabled={creatingLink} className="btn btn-secondary flex items-center gap-2"><FiShare2 /> {creatingLink ? 'Creating...' : 'Create Link'}</button>
            <button onClick={shareWhatsApp} className="btn btn-secondary flex items-center gap-2"><FiMessageCircle /> WhatsApp</button>
          </div>
        </div>
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={sendEmail} disabled={sending} className="btn btn-primary flex items-center gap-2">{sending ? <FiRefreshCw className="animate-spin" /> : <FiSend />} Send Email</button>
        </div>
      </div>
    </div>
  )
}

export default ProposalSendModal
