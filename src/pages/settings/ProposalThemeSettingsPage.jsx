import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiDroplet, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'
import { proposalThemeService } from '../../services/proposalThemeService'

const colorFields = [
  ['primaryColor', 'Primary color'], ['secondaryColor', 'Secondary color'], ['accentColor', 'Accent color'],
  ['backgroundColor', 'Background color'], ['textColor', 'Text color'], ['mutedTextColor', 'Muted text color'],
  ['dividerColor', 'Divider color'], ['lightBackground', 'Section background']
]

const emptyTheme = { name: '', config: { themeId: 'custom', primaryColor: '#111111', secondaryColor: '#333333', accentColor: '#111111', backgroundColor: '#FFFFFF', textColor: '#222222', mutedTextColor: '#6B7280', dividerColor: '#D1D5DB', lightBackground: '#F4F4F4', fontFamily: 'Helvetica', bodyFontFamily: 'Helvetica', headingStyle: 'uppercase', headerStyle: 'split', footerStyle: 'minimal', showLogo: true, showPageNumbers: true, showCompanyBranding: true, coverBackground: '#111111', coverTextColor: '#FFFFFF' } }

const ProposalThemeSettingsPage = () => {
  const [themes, setThemes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await proposalThemeService.getThemes()
      const items = response.data || []
      setThemes(items)
      setSelected(items.find(theme => theme.isDefault) || items[0] || null)
    } catch { toast.error('Failed to load proposal themes') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const updateConfig = (key, value) => setSelected(prev => ({ ...prev, config: { ...prev.config, [key]: value } }))

  const save = async () => {
    setSaving(true)
    try {
      if (selected._id) await proposalThemeService.updateTheme(selected._id, { name: selected.name, config: selected.config, isDefault: selected.isDefault })
      else await proposalThemeService.createTheme({ name: selected.name, config: selected.config })
      toast.success('Theme saved successfully')
      await load()
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save theme') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    if (!selected?._id || selected.isPreset) return
    if (!window.confirm('Delete this custom theme?')) return
    try { await proposalThemeService.deleteTheme(selected._id); toast.success('Theme deleted'); await load() }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to delete theme') }
  }

  const previewStyle = selected?.config || {}
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Proposal PDF Themes</h1><p className="text-gray-600">Customize the client-facing proposal document design</p></div>
        <button onClick={() => setSelected({ ...emptyTheme, config: { ...emptyTheme.config } })} className="btn btn-primary flex items-center gap-2"><FiPlus /> New Theme</button>
      </div>
      <div className="grid lg:grid-cols-[280px_1fr_360px] gap-6">
        <div className="card p-3 space-y-2">
          {themes.map(theme => <button key={theme._id} onClick={() => setSelected(theme)} className={`w-full text-left p-3 rounded-xl border ${selected?._id === theme._id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}><div className="flex items-center justify-between"><span className="font-semibold">{theme.name}</span>{theme.isDefault && <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded-full">Default</span>}</div><div className="flex gap-1 mt-3">{[theme.config?.primaryColor, theme.config?.secondaryColor, theme.config?.accentColor, theme.config?.backgroundColor].filter(Boolean).map((color, i) => <span key={i} className="w-5 h-5 rounded-full border" style={{ backgroundColor: color }} />)}</div></button>)}
        </div>
        {selected ? <div className="card p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Theme name</label><input value={selected.name || ''} onChange={e => setSelected({ ...selected, name: e.target.value })} className="input" /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!selected.isDefault} onChange={e => setSelected({ ...selected, isDefault: e.target.checked })} /> Use as default theme</label></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FiDroplet /> Colors</h3>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{colorFields.map(([key, label]) => <label key={key} className="text-sm text-gray-600"><span className="block mb-1">{label}</span><span className="flex items-center gap-2"><input type="color" value={previewStyle[key] || '#111111'} onChange={e => updateConfig(key, e.target.value)} className="h-10 w-12 rounded border" /><input value={previewStyle[key] || ''} onChange={e => updateConfig(key, e.target.value)} className="input" /></span></label>)}</div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm text-gray-600">Heading style<select value={previewStyle.headingStyle || 'uppercase'} onChange={e => updateConfig('headingStyle', e.target.value)} className="input mt-1"><option value="uppercase">Uppercase</option><option value="title">Title case</option></select></label>
            <label className="text-sm text-gray-600">Header style<select value={previewStyle.headerStyle || 'split'} onChange={e => updateConfig('headerStyle', e.target.value)} className="input mt-1"><option value="split">Split cover</option><option value="compact">Compact</option></select></label>
            <label className="text-sm text-gray-600">Footer style<select value={previewStyle.footerStyle || 'minimal'} onChange={e => updateConfig('footerStyle', e.target.value)} className="input mt-1"><option value="minimal">Minimal</option><option value="branded">Branded</option></select></label>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-gray-700">{[['showLogo', 'Logo'], ['showPageNumbers', 'Page numbers'], ['showCompanyBranding', 'Company branding']].map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={previewStyle[key] !== false} onChange={e => updateConfig(key, e.target.checked)} /> {label}</label>)}</div>
          <div className="flex justify-between border-t pt-5"><button onClick={remove} disabled={selected.isPreset || selected.isDefault} className="btn btn-secondary text-red-600 flex items-center gap-2"><FiTrash2 /> Delete</button><button onClick={save} disabled={saving} className="btn btn-primary flex items-center gap-2">{saving ? 'Saving...' : <><FiSave /> Save Theme</>}</button></div>
        </div> : <div className="card p-10 text-center text-gray-500">Select or create a theme</div>}
        <div className="card p-5 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
          <div className="rounded-xl border overflow-hidden shadow-sm" style={{ backgroundColor: previewStyle.backgroundColor || '#fff' }}>
            <div className="h-40 flex flex-col justify-between p-5" style={{ backgroundColor: previewStyle.coverBackground || previewStyle.primaryColor || '#111' }}>
              <div className="flex items-center gap-3"><span className="w-10 h-10 rounded bg-white/20" /><span className="text-white font-bold">Datawyn Technologies</span></div>
              <div><p className="text-xs uppercase" style={{ color: previewStyle.coverTextColor || '#d1d5db' }}>Project Proposal</p><p className="text-white text-2xl font-bold">Premium Software Solution</p></div>
            </div>
            <div className="p-5 space-y-4">
              <div className="h-3 w-2/3 rounded" style={{ backgroundColor: previewStyle.primaryColor }} />
              <div className="h-2 w-full rounded" style={{ backgroundColor: previewStyle.dividerColor }} />
              <div className="grid grid-cols-3 gap-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded border p-2" style={{ borderColor: previewStyle.dividerColor, backgroundColor: previewStyle.lightBackground }}><div className="h-2 w-3/4 rounded mb-2" style={{ backgroundColor: previewStyle.primaryColor }} /><div className="h-2 w-1/2 rounded" style={{ backgroundColor: previewStyle.mutedTextColor }} /></div>)}</div>
              <div className="border rounded-lg overflow-hidden"><div className="h-8" style={{ backgroundColor: previewStyle.primaryColor }} /><div className="h-20 bg-white" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalThemeSettingsPage
