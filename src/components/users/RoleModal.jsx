import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'

const RoleModal = ({ isOpen, onClose, onSubmit, role, mode, permissions }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  })

  useEffect(() => {
    if (role && mode === 'edit') {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions?.map(p => p._id) || []
      })
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: []
      })
    }
  }, [role, mode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const handleSelectAllModule = (modulePermissions) => {
    const moduleIds = modulePermissions.map(p => p._id)
    const allSelected = moduleIds.every(id => formData.permissions.includes(id))
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(id => !moduleIds.includes(id))
        : [...new Set([...prev.permissions, ...moduleIds])]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate
    if (!formData.name) {
      alert('Role name is required')
      return
    }

    onSubmit(formData)
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {})

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Role' : 'Edit Role'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Role Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                disabled={role?.isSystem}
              />
              {role?.isSystem && (
                <p className="text-xs text-gray-500 mt-1">System roles cannot be renamed</p>
              )}
            </div>

          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Permissions</h3>
            
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
              const moduleIds = modulePermissions.map(p => p._id)
              const allSelected = moduleIds.every(id => formData.permissions.includes(id))
              const someSelected = moduleIds.some(id => formData.permissions.includes(id))
              
              return (
                <div key={module} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900 capitalize">{module}</h4>
                    <button
                      type="button"
                      onClick={() => handleSelectAllModule(modulePermissions)}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {modulePermissions.map(permission => (
                      <label key={permission._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission._id)}
                          onChange={() => handlePermissionToggle(permission._id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          disabled={role?.isSystem}
                        />
                        <span className="text-sm text-gray-700">{permission.description}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              disabled={role?.isSystem}
            >
              {mode === 'create' ? 'Create Role' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoleModal
