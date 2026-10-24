import { copyCompanySnapshot } from './companyFields'

const emptyCustomer = { name: '', email: '', phone: '', address: '' }

export { emptyCustomer }
export { emptyCompany } from './companyFields'
export { copyCompanySnapshot }

export function copyCustomerSnapshot(source) {
  if (!source) return null
  const name = source.name?.trim() ?? ''
  if (!name) return null
  return {
    name,
    email: source.email?.trim() ?? '',
    phone: source.phone?.trim() ?? '',
    address: source.address?.trim() ?? '',
  }
}

export function resolveCompany(invoice, companies) {
  if (invoice?.companySnapshot?.name) return invoice.companySnapshot
  if (invoice?.companyId) {
    return companies.find((c) => c.id === invoice.companyId) ?? null
  }
  return null
}

export function resolveCustomer(invoice, customers) {
  if (invoice?.customerSnapshot?.name) return invoice.customerSnapshot
  if (invoice?.customerId) {
    return customers.find((c) => c.id === invoice.customerId) ?? null
  }
  return null
}

export function partyDisplayName(party) {
  return party?.name?.trim() || '—'
}
