import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { customerTypeService } from '../services/customerTypeService'

const CustomerTypeField = ({ value, onChange }) => {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // null | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTypes = async () => {
    try {
      const response = await customerTypeService.getCustomerTypes()
      if (response.success) {
        setTypes(response.data)
      }
    } catch (error) {
      toast.error('Failed to load customer types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  // Default to the first type when nothing is selected yet
  useEffect(() => {
    if (!loading && types.length > 0 && !value) {
      onChange(types[0].name)
    }
  }, [loading, types, value])

  const selectedType = types.find(t => t.name === value)

  const startAdd = () => {
    setMode('add')
    setEditingId(null)
    setInputValue('')
  }

  const startEdit = () => {
    if (!selectedType) return
    setMode('edit')
    setEditingId(selectedType._id)
    setInputValue(selectedType.name)
  }

  const cancelEdit = () => {
    setMode(null)
    setEditingId(null)
    setInputValue('')
  }

  const handleSave = async () => {
    const name = inputValue.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      if (mode === 'add') {
        const response = await customerTypeService.createCustomerType(name)
        if (response.success) {
          toast.success('Customer type added')
          await fetchTypes()
          onChange(response.data.name)
          cancelEdit()
        }
      } else {
        const response = await customerTypeService.updateCustomerType(editingId, name)
        if (response.success) {
          toast.success('Customer type updated')
          const oldName = selectedType?.name
          await fetchTypes()
          if (oldName && oldName !== response.data.name && value === oldName) {
            onChange(response.data.name)
          }
          cancelEdit()
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save customer type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedType) return
    if (!window.confirm(`Delete customer type "${selectedType.name}"?`)) return

    try {
      const response = await customerTypeService.deleteCustomerType(selectedType._id)
      if (response.success) {
        toast.success('Customer type deleted')
        if (value === selectedType.name) {
          onChange('')
        }
        await fetchTypes()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer type')
    }
  }

  if (mode) {
    return (
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            } else if (e.key === 'Escape') {
              cancelEdit()
            }
          }}
          placeholder="Type name"
          className="input flex-1"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-secondary px-2"
          title={mode === 'add' ? 'Add' : 'Save'}
        >
          <FiCheck />
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="btn btn-secondary px-2"
          title="Cancel"
        >
          <FiX />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input flex-1"
        disabled={loading}
      >
        {types.length === 0 && <option value="">No types</option>}
        {value && !types.some(t => t.name === value) && (
          <option value={value}>{value}</option>
        )}
        {types.map((type) => (
          <option key={type._id} value={type.name}>
            {type.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={startAdd}
        className="btn btn-secondary px-2"
        title="Add customer type"
      >
        <FiPlus />
      </button>
      <button
        type="button"
        onClick={startEdit}
        disabled={!selectedType}
        className="btn btn-secondary px-2 disabled:opacity-40"
        title="Edit customer type"
      >
        <FiEdit2 />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!selectedType}
        className="btn btn-secondary px-2 disabled:opacity-40 text-red-600"
        title="Delete customer type"
      >
        <FiTrash2 />
      </button>
    </div>
  )
}

export default CustomerTypeField
