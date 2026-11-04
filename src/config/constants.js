export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted'
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  converted: 'Converted'
}

export const INVOICE_STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  rejected: 'red',
  expired: 'orange',
  converted: 'purple'
}

export const PROPOSAL_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired'
}

export const PROPOSAL_STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  viewed: 'purple',
  accepted: 'green',
  rejected: 'red',
  expired: 'orange'
}

export const CUSTOMER_TYPE = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business'
}

export const PRODUCT_TYPE = {
  PRODUCT: 'product',
  SERVICE: 'service'
}

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff'
}

export const PAYMENT_TERMS = [
  'Full Advance',
  '50% Advance',
  '30% Advance',
  '50% Advance, 50% on Completion',
  'Due on Receipt',
  'Custom'
]

export const UNITS = [
  'Piece',
  'Hour',
  'Day',
  'Month',
  'Project',
  'Service',
  'Kg',
  'Litre',
  'Meter',
  'Square Meter'
]

export const DEFAULT_TERMS = [
  'This is a proforma invoice and not a tax invoice.',
  'Prices are valid for the specified validity period.',
  'Payment terms are as mentioned above.',
  'Additional requirements may be charged separately.',
  'Taxes are applicable as per government regulations.'
]
