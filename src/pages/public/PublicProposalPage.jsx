import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiDownload, FiMessageSquare, FiX } from 'react-icons/fi'
import { publicProposalService } from '../../services/publicProposalService'
import { formatCurrency } from '../../utils/formatCurrency'

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const PublicProposalPage = () => {
  const token = window.location.pathname.split('/').pop()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await publicProposalService.getProposal(token)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'This proposal link is invalid or has expired.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [token])

  const download = async () => {
    const response = await publicProposalService.downloadPDF(token)
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.proposal.proposalNumber}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const respond = async (type) => {
    setSubmitting(true)
    try {
      await publicProposalService.respond(token, type, { message, name: data.proposal.customerSnapshot?.contactPerson })
      setAction(null)
      await load()
    } catch (err) { alert(err.response?.data?.message || 'Unable to record your response.') }
    finally { setSubmitting(false) }
  }

  const sections = useMemo(() => {
    if (!data) return []
    const p = data.proposal
    return [
      p.projectDescription || p.objectives || p.proposedSolution ? { title: 'Project Overview', content: [p.projectDescription && ['Description', p.projectDescription], p.objectives && ['Objectives', p.objectives], p.proposedSolution && ['Proposed solution', p.proposedSolution]].filter(Boolean) } : null,
      p.scopeOfWork?.length ? { title: 'Scope of Work', items: p.scopeOfWork } : null,
      p.deliverables?.length || p.technologyStack?.length ? { title: 'Deliverables & Technology', items: p.deliverables, tech: p.technologyStack } : null,
      p.timeline?.startDate || p.timeline?.estimatedCompletionDate || p.timeline?.milestones?.length ? { title: 'Project Timeline', timeline: p.timeline } : null,
      p.items?.length ? { title: 'Pricing', items: p.items, summary: p } : null,
      p.paymentTerms || p.advanceAmount || p.balanceAmount || p.paymentSchedule?.length ? { title: 'Payment Terms', payment: p } : null,
      p.termsAndConditions || p.notes ? { title: 'Terms & Conditions', terms: p.termsAndConditions, notes: p.notes } : null
    ].filter(Boolean)
  }, [data])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" /></div>
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6"><div className="max-w-md bg-white rounded-xl p-8 text-center shadow"><h1 className="text-xl font-bold">Proposal unavailable</h1><p className="text-gray-600 mt-3">{error}</p></div></div>

  const p = data.proposal
  const company = data.company || {}
  const finalStatus = ['accepted', 'rejected'].includes(p.status)
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {company.logo && <img src={company.logo} alt="" className="h-12 w-12 object-contain bg-white rounded-lg p-1" />}
            <div><p className="text-xs uppercase tracking-[0.2em] text-gray-400">Project Proposal</p><h1 className="text-xl font-bold">{company.companyName || 'Datawyn Technologies'}</h1></div>
          </div>
          <div className="flex gap-2">
            <button onClick={download} className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold"><FiDownload /> Download PDF</button>
            {!finalStatus && <button onClick={() => setAction('accept')} className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold"><FiCheck /> Accept</button>}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-10 space-y-8">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div><p className="text-sm text-gray-500">{p.proposalNumber} · {formatDate(p.proposalDate)}</p><h2 className="text-3xl font-bold mt-2">{p.projectTitle}</h2>{p.projectSubtitle && <p className="text-gray-600 mt-2">{p.projectSubtitle}</p>}</div>
            <div className="text-right"><p className="text-sm text-gray-500">Prepared for</p><p className="font-semibold text-lg">{p.customerSnapshot?.companyName}</p><p className="text-gray-600">{p.customerSnapshot?.contactPerson}</p></div>
          </div>
          {p.status !== 'draft' && <div className="mt-6 rounded-lg bg-gray-100 px-4 py-3 text-sm capitalize">Status: {p.status.replace(/_/g, ' ')}</div>}
        </section>
        {sections.map(section => <section key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7"><h3 className="text-lg font-bold border-b border-gray-200 pb-4 mb-5">{section.title}</h3>{renderSection(section, p)}</section>)}
        {!finalStatus && <section className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col sm:flex-row gap-3"><button onClick={() => setAction('request-changes')} className="btn-secondary flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold"><FiMessageSquare /> Request Changes</button><button onClick={() => setAction('reject')} className="px-5 py-3 rounded-lg font-semibold border border-red-200 text-red-700">Reject Proposal</button></section>}
        {finalStatus && <section className="bg-white rounded-2xl border border-gray-200 p-7 text-center"><h3 className="text-xl font-bold capitalize">Proposal {p.status}</h3><p className="text-gray-600 mt-2">Thank you for your response.</p></section>}
      </main>
      {action && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50"><div className="bg-white rounded-2xl max-w-lg w-full p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold capitalize">{action.replace('-', ' ')} proposal</h3><button onClick={() => setAction(null)}><FiX /></button></div>{action !== 'accept' && <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Share any details or requested changes..." className="w-full border rounded-lg p-3 min-h-28" />}{action === 'accept' && <p className="text-gray-600">Confirm that you accept this proposal and its pricing.</p>}<div className="flex justify-end gap-3 mt-5"><button onClick={() => setAction(null)} className="px-4 py-2 rounded-lg border">Cancel</button><button disabled={submitting} onClick={() => respond(action)} className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50">{submitting ? 'Saving...' : 'Confirm'}</button></div></div></div>}
    </div>
  )
}

const renderSection = (section, p) => {
  if (section.content) return <div className="space-y-5">{section.content.map(([label, value]) => <div key={label}><h4 className="font-semibold text-gray-700">{label}</h4><p className="text-gray-600 whitespace-pre-line mt-1">{value}</p></div>)}</div>
  if (section.items && section.title === 'Scope of Work') return <div className="space-y-4">{section.items.map((item, i) => <div key={i} className="border-l-4 border-gray-900 pl-4"><h4 className="font-semibold">{i + 1}. {item.title}</h4>{item.description && <p className="text-gray-600 mt-1">{item.description}</p>}{item.bulletPoints?.map((point, j) => <p key={j} className="text-gray-600 text-sm">• {point}</p>)}</div>)}</div>
  if (section.items && section.title === 'Deliverables & Technology') return <div className="space-y-6"><div className="grid md:grid-cols-2 gap-4">{section.items.map((item, i) => <div key={i} className="border rounded-xl p-4"><h4 className="font-semibold">{item.name}</h4>{item.description && <p className="text-gray-600 text-sm mt-1">{item.description}</p>}{item.quantity && <p className="text-xs text-gray-500 mt-2">Quantity: {item.quantity}</p>}</div>)}</div>{section.tech?.length > 0 && <div><h4 className="font-semibold mb-3">Technology Stack</h4><div className="flex flex-wrap gap-2">{section.tech.map((tech, i) => <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{tech}</span>)}</div></div>}</div>
  if (section.timeline) { const t = section.timeline; return <div className="space-y-5"><div className="grid sm:grid-cols-3 gap-4">{[['Start date', t.startDate], ['Completion', t.estimatedCompletionDate], ['Duration', t.duration]].filter(([,v]) => v).map(([label, value]) => <div key={label} className="bg-gray-50 rounded-lg p-4"><p className="text-xs uppercase text-gray-500">{label}</p><p className="font-semibold mt-1">{label === 'Duration' ? value : formatDate(value)}</p></div>)}</div>{t.milestones?.map((m, i) => <div key={i} className="flex gap-4"><div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shrink-0">{i + 1}</div><div><h4 className="font-semibold">{m.title}</h4><p className="text-sm text-gray-500">{formatDate(m.expectedDate)}{m.duration ? ` · ${m.duration}` : ''}</p>{m.description && <p className="text-gray-600 mt-1">{m.description}</p>}</div></div>)}</div> }
  if (section.summary) { const s = section.summary; return <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-900 text-white"><tr><th className="text-left p-3">S.No</th><th className="text-left p-3">Product / Service</th><th className="text-left p-3">Description</th><th className="text-right p-3">Qty</th><th className="text-right p-3">Unit Price</th><th className="text-right p-3">Total</th></tr></thead><tbody>{section.items.map((item, i) => <tr key={i} className="border-b"><td className="p-3">{i + 1}</td><td className="p-3 font-medium">{item.isCustom ? item.customName : item.productSnapshot?.name}</td><td className="p-3 text-gray-600">{item.isCustom ? item.customDescription : item.productSnapshot?.description}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{formatCurrency(item.rate)}</td><td className="p-3 text-right font-semibold">{formatCurrency(item.total)}</td></tr>)}</tbody></table><div className="ml-auto mt-5 max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(s.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(Number(s.itemDiscount || 0) + Number(s.invoiceDiscount || 0))}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatCurrency(s.totalTax)}</span></div><div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Grand Total</span><span>{formatCurrency(s.grandTotal)}</span></div></div></div> }
  if (section.payment) { const p = section.payment; return <div className="grid md:grid-cols-3 gap-4">{[['Payment terms', p.paymentTerms], ['Advance amount', p.advanceAmount ? formatCurrency(p.advanceAmount) : ''], ['Remaining amount', p.balanceAmount ? formatCurrency(p.balanceAmount) : '']].filter(([,v]) => v).map(([label, value]) => <div key={label} className="bg-gray-50 rounded-lg p-4"><p className="text-xs uppercase text-gray-500">{label}</p><p className="font-semibold mt-1">{value}</p></div>)}{p.paymentSchedule?.map((payment, i) => <div key={i} className="bg-gray-50 rounded-lg p-4"><p className="font-semibold">{payment.stage}</p><p className="text-sm text-gray-600">{payment.percentage}% · {formatCurrency(payment.amount)}{payment.dueDate ? ` · ${formatDate(payment.dueDate)}` : ''}</p></div>)}</div> }
  return <div className="space-y-5">{section.terms && <div><h4 className="font-semibold">Terms & Conditions</h4><p className="text-gray-600 whitespace-pre-line mt-1">{section.terms}</p></div>}{section.notes && <div><h4 className="font-semibold">Additional Notes</h4><p className="text-gray-600 whitespace-pre-line mt-1">{section.notes}</p></div>}</div>
}

export default PublicProposalPage
