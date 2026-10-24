/** Remove large base64 blobs from data sent to Firestore (kept in localStorage). */

const COMPANY_IMAGE_FIELDS = ['logoDataUrl', 'signatureDataUrl']

export function sanitizeCompanyForCloud(company) {
  if (!company) return company
  const out = { ...company }
  for (const key of COMPANY_IMAGE_FIELDS) {
    if (out[key]) out[key] = ''
  }
  return out
}

export function sanitizeProductForCloud(product) {
  if (!product) return product
  return { ...product, imageDataUrl: '' }
}

export function sanitizeInvoiceForCloud(invoice) {
  if (!invoice) return invoice
  return {
    ...invoice,
    companySnapshot: invoice.companySnapshot
      ? sanitizeCompanyForCloud(invoice.companySnapshot)
      : invoice.companySnapshot,
    lineItems: (invoice.lineItems ?? []).map((line) => ({
      ...line,
      imageDataUrl: '',
    })),
  }
}

export function sanitizeSliceForCloud(sliceName, items) {
  switch (sliceName) {
    case 'companies':
      return items.map(sanitizeCompanyForCloud)
    case 'products':
      return items.map(sanitizeProductForCloud)
    case 'invoices':
      return items.map(sanitizeInvoiceForCloud)
    default:
      return items
  }
}
