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
  under_review: 'Under Review',
  changes_requested: 'Changes Requested',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired'
}

export const PROPOSAL_STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  viewed: 'purple',
  under_review: 'yellow',
  changes_requested: 'orange',
  accepted: 'green',
  rejected: 'red',
  expired: 'orange'
}

export const QUOTATION_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired'
}

export const QUOTATION_STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  viewed: 'purple',
  accepted: 'green',
  rejected: 'red',
  expired: 'orange'
}

export const QUOTATION_DEFAULT_TERMS = `1. This quotation is valid until the date mentioned above. Prices are subject to change after the validity period.
2. The quoted amount includes only the services explicitly listed in the Scope of Work. Any work outside the defined scope will be charged additionally.
3. Payment shall be made as per the payment schedule mentioned in this quotation.
4. Project timelines are estimates and may vary based on client feedback, content approval and unforeseen circumstances.
5. Third-party licenses, domains, hosting, payment gateway charges and other external services are not included unless explicitly mentioned.
6. Datawyn Technologies shall not be liable for delays caused by factors beyond its reasonable control.
7. This quotation does not constitute a contract until accepted in writing by both parties.
8. Any disputes shall be subject to the jurisdiction of the courts at the company's registered location.`

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
