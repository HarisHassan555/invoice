import { INVOICE_ENQUIRY_FOOTER } from './invoiceDocumentCopy'

export const emptyCompany = {
  name: '',
  email: '',
  phone: '',
  phones: [''],
  address: '',
  taxId: '',
  website: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  logoDataUrl: '',
  signatureDataUrl: '',
  enquiryFooter: INVOICE_ENQUIRY_FOOTER,
  defaultInvoiceNotes: '',
}

/** Normalized list of non-empty phone strings (supports legacy single `phone`). */
export function normalizeCompanyPhones(source) {
  if (Array.isArray(source?.phones)) {
    return source.phones.map((p) => String(p ?? '').trim()).filter(Boolean)
  }
  const legacy = source?.phone?.trim()
  return legacy ? [legacy] : []
}

export function companyPhonesForForm(source) {
  if (Array.isArray(source?.phones)) {
    const list = source.phones.map((p) => String(p ?? ''))
    return list.length ? list : ['']
  }
  const legacy = source?.phone?.trim()
  return legacy ? [legacy] : ['']
}

export function finalizeCompanyFields(data) {
  let phones
  if (Array.isArray(data?.phones)) {
    phones = data.phones.map((p) => String(p ?? '').trim()).filter(Boolean)
  } else {
    phones = normalizeCompanyPhones(data)
  }
  return {
    ...data,
    phones,
    phone: phones[0] ?? '',
    enquiryFooter: data.enquiryFooter?.trim() ?? '',
    defaultInvoiceNotes: data.defaultInvoiceNotes?.trim() ?? '',
  }
}

export function companyEnquiryFooter(company) {
  const text = company?.enquiryFooter?.trim()
  return text || INVOICE_ENQUIRY_FOOTER
}

export function copyCompanySnapshot(source) {
  if (!source) return null
  const finalized = finalizeCompanyFields(source)
  const out = {}
  for (const key of Object.keys(emptyCompany)) {
    if (key === 'phones') {
      out.phones = [...finalized.phones]
      continue
    }
    const val = finalized[key]
    out[key] = typeof val === 'string' ? val.trim() : (val ?? '')
  }
  if (!out.name) return null
  out.phone = finalized.phones[0] ?? ''
  return out
}
