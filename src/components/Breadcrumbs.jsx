import { useLocation, Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'

const Breadcrumbs = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  const breadcrumbMap = {
    'dashboard': 'Dashboard',
    'customers': 'Customers',
    'products': 'Products',
    'proforma': 'Proforma Invoices',
    'quotations': 'Quotations',
    'invoices': 'Invoices',
    'settings': 'Settings',
    'company': 'Company Settings',
    'login': 'Login',
    'register': 'Register',
    'create': 'Create',
    'edit': 'Edit',
    'new': 'New'
  }

  const getBreadcrumbName = (name) => {
    return breadcrumbMap[name] || name.charAt(0).toUpperCase() + name.slice(1)
  }

  if (pathnames.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link to="/" className="hover:text-primary-600 transition-colors">
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const displayName = getBreadcrumbName(name)

        return (
          <div key={name} className="flex items-center gap-2">
            <FiChevronRight size={16} className="text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900">{displayName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-primary-600 transition-colors">
                {displayName}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs
