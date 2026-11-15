import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PermissionRoute from './PermissionRoute'

// Layouts
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'

// Pages
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'

// Customer Pages
import CustomerListPage from '../pages/customers/CustomerListPage'
import CustomerCreatePage from '../pages/customers/CustomerCreatePage'
import CustomerDetailPage from '../pages/customers/CustomerDetailPage'
import CustomerEditPage from '../pages/customers/CustomerEditPage'

// Product Pages
import ProductListPage from '../pages/products/ProductListPage'
import ProductCreatePage from '../pages/products/ProductCreatePage'
import ProductDetailPage from '../pages/products/ProductDetailPage'
import ProductEditPage from '../pages/products/ProductEditPage'

// Proforma Invoice Pages
import ProformaListPage from '../pages/proforma/ProformaListPage'
import ProformaCreatePage from '../pages/proforma/ProformaCreatePage'
import ProformaDetailPage from '../pages/proforma/ProformaDetailPage'
import ProformaEditPage from '../pages/proforma/ProformaEditPage'

// Proposal Pages
import ProposalListPage from '../pages/proposals/ProposalListPage'
import ProposalCreatePage from '../pages/proposals/ProposalCreatePage'
import ProposalDetailPage from '../pages/proposals/ProposalDetailPage'
import ProposalEditPage from '../pages/proposals/ProposalEditPage'
import PublicProposalPage from '../pages/public/PublicProposalPage'

// Invoice Pages
import InvoiceListPage from '../pages/invoices/InvoiceListPage'
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage'

// Settings Pages
import CompanySettingsPage from '../pages/settings/CompanySettingsPage'
import ProposalThemeSettingsPage from '../pages/settings/ProposalThemeSettingsPage'

// Payment Pages
import PaymentListPage from '../pages/payments/PaymentListPage'

// User Management Pages
import UserListPage from '../pages/users/UserListPage'
import RoleListPage from '../pages/users/RoleListPage'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>
      <Route path="/proposal/view/:token" element={<PublicProposalPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <PermissionRoute requiredPermission="dashboard.view">
            <DashboardPage />
          </PermissionRoute>
        } />
        
        {/* Customer Routes */}
        <Route path="customers" element={
          <PermissionRoute requiredPermission="customers.view">
            <CustomerListPage />
          </PermissionRoute>
        } />
        <Route path="customers/new" element={
          <PermissionRoute requiredPermission="customers.create">
            <CustomerCreatePage />
          </PermissionRoute>
        } />
        <Route path="customers/:id" element={
          <PermissionRoute requiredPermission="customers.view">
            <CustomerDetailPage />
          </PermissionRoute>
        } />
        <Route path="customers/:id/edit" element={
          <PermissionRoute requiredPermission="customers.edit">
            <CustomerEditPage />
          </PermissionRoute>
        } />
        
        {/* Product Routes */}
        <Route path="products" element={
          <PermissionRoute requiredPermission="products.view">
            <ProductListPage />
          </PermissionRoute>
        } />
        <Route path="products/new" element={
          <PermissionRoute requiredPermission="products.create">
            <ProductCreatePage />
          </PermissionRoute>
        } />
        <Route path="products/:id" element={
          <PermissionRoute requiredPermission="products.view">
            <ProductDetailPage />
          </PermissionRoute>
        } />
        <Route path="products/:id/edit" element={
          <PermissionRoute requiredPermission="products.edit">
            <ProductEditPage />
          </PermissionRoute>
        } />
        
        {/* Proforma Invoice Routes */}
        <Route path="proforma" element={
          <PermissionRoute requiredPermission="proforma.view">
            <ProformaListPage />
          </PermissionRoute>
        } />
        <Route path="proforma/new" element={
          <PermissionRoute requiredPermission="proforma.create">
            <ProformaCreatePage />
          </PermissionRoute>
        } />
        <Route path="proforma/:id" element={
          <PermissionRoute requiredPermission="proforma.view">
            <ProformaDetailPage />
          </PermissionRoute>
        } />
        <Route path="proforma/:id/edit" element={
          <PermissionRoute requiredPermission="proforma.edit">
            <ProformaEditPage />
          </PermissionRoute>
        } />
        
        {/* Proposal Routes */}
        <Route path="proposals" element={
          <PermissionRoute requiredPermission="proposals.view">
            <ProposalListPage />
          </PermissionRoute>
        } />
        <Route path="proposals/new" element={
          <PermissionRoute requiredPermission="proposals.create">
            <ProposalCreatePage />
          </PermissionRoute>
        } />
        <Route path="proposals/:id" element={
          <PermissionRoute requiredPermission="proposals.view">
            <ProposalDetailPage />
          </PermissionRoute>
        } />
        <Route path="proposals/:id/edit" element={
          <PermissionRoute requiredPermission="proposals.edit">
            <ProposalEditPage />
          </PermissionRoute>
        } />
        
        {/* Invoice Routes */}
        <Route path="invoices" element={
          <PermissionRoute requiredPermission="invoices.view">
            <InvoiceListPage />
          </PermissionRoute>
        } />
        <Route path="invoices/:id" element={
          <PermissionRoute requiredPermission="invoices.view">
            <InvoiceDetailPage />
          </PermissionRoute>
        } />

        {/* Payment Routes */}
        <Route path="payments" element={
          <PermissionRoute requiredPermission="payment.view">
            <PaymentListPage />
          </PermissionRoute>
        } />

        {/* Settings Routes */}
        <Route path="settings/company" element={
          <PermissionRoute requiredPermission="settings.view">
            <CompanySettingsPage />
          </PermissionRoute>
        } />
        <Route path="settings/proposal-themes" element={
          <PermissionRoute requiredPermission="settings.view">
            <ProposalThemeSettingsPage />
          </PermissionRoute>
        } />
        
        {/* User Management Routes */}
        <Route path="settings/users" element={
          <PermissionRoute requiredPermission="users.view">
            <UserListPage />
          </PermissionRoute>
        } />
        <Route path="settings/roles" element={
          <PermissionRoute requiredPermission="roles.view">
            <RoleListPage />
          </PermissionRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
