import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiEdit, FiArrowLeft, FiFileText, FiCreditCard, FiUser, FiMapPin } from 'react-icons/fi'
import { customerService } from '../../services/customerService'
import { formatDate } from '../../utils/dateUtils'
import { formatCurrency } from '../../utils/formatCurrency'
import toast from 'react-hot-toast'
import PaymentDashboard from '../../components/PaymentDashboard'
import { useAuth } from '../../context/AuthContext'

const CustomerDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canViewPaymentSchedule = hasPermission('customers.view_payment_schedule')
  const [customer, setCustomer] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const [customerRes, invoicesRes] = await Promise.all([
        customerService.getCustomer(id),
        customerService.getCustomerInvoices(id)
      ])
      
      if (customerRes.success) {
        setCustomer(customerRes.data)
      }
      if (invoicesRes.success) {
        setInvoices(invoicesRes.data.items || invoicesRes.data)
      }
    } catch (error) {
      toast.error('Failed to fetch customer details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft size={20} />
          Back to Customers
        </button>
        <button
          onClick={() => navigate(`/customers/${id}/edit`)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiEdit size={20} />
          Edit Customer
        </button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiUser />
              Customer Details
            </button>
            {canViewPaymentSchedule && (
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiCreditCard />
                Payment Schedule
              </button>
            )}
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiFileText />
              Invoice History
            </button>
          </nav>
        </div>

        {/* Customer Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6 mt-6">
            {/* Customer Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="font-medium text-gray-900">{customer.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="font-medium text-gray-900">{customer.contactPerson || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{customer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{customer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Type</p>
                  <p className="font-medium text-gray-900 capitalize">{customer.customerType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GSTIN</p>
                  <p className="font-medium text-gray-900">{customer.gstin || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PAN</p>
                  <p className="font-medium text-gray-900">{customer.pan || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created Date</p>
                  <p className="font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
              </div>

              {customer.notes && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium text-gray-900 mt-1">{customer.notes}</p>
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMapPin />
                  Billing Address
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-900">{customer.billingAddress?.street || '-'}</p>
                  <p className="text-gray-600">
                    {customer.billingAddress?.city && `${customer.billingAddress.city}, `}
                    {customer.billingAddress?.state && `${customer.billingAddress.state} - `}
                    {customer.billingAddress?.pincode}
                  </p>
                  <p className="text-gray-600">{customer.billingAddress?.country}</p>
                </div>
              </div>

              <div className="card bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMapPin />
                  Shipping Address
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-900">{customer.shippingAddress?.street || '-'}</p>
                  <p className="text-gray-600">
                    {customer.shippingAddress?.city && `${customer.shippingAddress.city}, `}
                    {customer.shippingAddress?.state && `${customer.shippingAddress.state} - `}
                    {customer.shippingAddress?.pincode}
                  </p>
                  <p className="text-gray-600">{customer.shippingAddress?.country}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Schedule Tab */}
        {activeTab === 'payments' && canViewPaymentSchedule && (
          <div className="mt-6">
            <PaymentDashboard customerId={id} />
          </div>
        )}

        {/* Invoice History Tab */}
        {activeTab === 'invoices' && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
            {invoices.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td className="font-medium">{invoice.invoiceNumber}</td>
                        <td>{formatDate(invoice.invoiceDate)}</td>
                        <td>{formatCurrency(invoice.grandTotal)}</td>
                        <td>
                          <span className={`badge badge-${invoice.status === 'draft' ? 'gray' : invoice.status === 'sent' ? 'blue' : invoice.status === 'accepted' ? 'green' : invoice.status === 'rejected' ? 'red' : 'orange'}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No invoices found for this customer</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerDetailPage
