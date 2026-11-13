import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { FiMenu, FiX, FiHome, FiUsers, FiBox, FiFileText, FiSettings, FiLogOut, FiUserCheck, FiShield, FiBriefcase, FiCreditCard, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useCompany } from '../context/CompanyContext'
import Breadcrumbs from '../components/Breadcrumbs'
import WelcomeHeader from '../components/WelcomeHeader'
import defaultLogo from '../assets/datawyn-logo.png'

const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth()
  const { sidebarOpen, toggleSidebar } = useApp()
  const { companySettings } = useCompany()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [hoverSuppressed, setHoverSuppressed] = useState(false)

  // Sidebar shows full content when pinned open, or when hovered while collapsed
  // (hover preview is suppressed right after clicking close, until the mouse leaves)
  const isSidebarExpanded = sidebarOpen || (sidebarHovered && !hoverSuppressed)

  const handleToggleSidebar = () => {
    if (sidebarOpen) {
      setHoverSuppressed(true)
    }
    toggleSidebar()
  }

  const handleSidebarMouseLeave = () => {
    setSidebarHovered(false)
    setHoverSuppressed(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard', permission: 'dashboard.view' },
    { path: '/customers', icon: FiUsers, label: 'Customers', permission: 'customers.view' },
    { path: '/products', icon: FiBox, label: 'Products', permission: 'products.view' },
    { path: '/proposals', icon: FiBriefcase, label: 'Proposals', permission: 'proposals.view' },
    { path: '/proforma', icon: FiFileText, label: 'Proforma Invoices', permission: 'proforma.view' },
    { path: '/invoices', icon: FiFileText, label: 'Invoices', permission: 'invoices.view' },
    { path: '/payments', icon: FiCreditCard, label: 'Payments', permission: 'payment.view' },
    { path: '/settings/users', icon: FiUserCheck, label: 'Users', permission: 'users.view' },
    { path: '/settings/roles', icon: FiShield, label: 'Roles', permission: 'roles.view' },
    { path: '/settings/company', icon: FiSettings, label: 'Settings', permission: 'settings.view' },
  ]

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <img
              src={companySettings?.logo || defaultLogo}
              alt="Company Logo"
              className="w-8 h-8 object-contain"
            />
            {/* <h1 className="text-lg font-semibold text-gray-900">
              {companySettings?.companyName || 'Datawyn CRM'}
            </h1> */}
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="bg-white w-64 h-full p-4">
            <nav className="space-y-2 mt-16">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
              >
                <FiLogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={handleSidebarMouseLeave}
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 overflow-hidden flex flex-col ${isSidebarExpanded ? 'w-64' : 'w-20'
          } hidden lg:block`}
      >
        <div className={`flex items-center border-b py-3 ${isSidebarExpanded ? 'px-4' : 'px-2'}`}>
          <div className="flex-1 flex justify-center">
            <img
              src={companySettings?.logo || defaultLogo}
              alt="Company Logo"
              className={`object-contain ${isSidebarExpanded ? 'w-[100px]' : 'w-8 h-8'}`}
            />
          </div>
          <button
            onClick={handleToggleSidebar}
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <FiChevronsLeft size={18} /> : <FiChevronsRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto dw-custom-scrollbar pb-20">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon size={20} />
                <span className={isSidebarExpanded ? '' : 'hidden'}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 bg-black left-0 right-0 px-4 py-1 border-t">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center uppercase px-4 py-3 rounded-lg text-white ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}
            title={!isSidebarExpanded ? 'Logout' : ''}
          >
            <span className={isSidebarExpanded ? '' : 'hidden'}>Logout</span>
            <FiLogOut size={20} />

          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          } pt-16 lg:pt-0`}
      >
        <div className="p-4 lg:p-8">
          <div className="flex justify-end mb-4">
            <WelcomeHeader />
          </div>
          
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
