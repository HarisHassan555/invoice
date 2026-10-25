/** Prepare slices for Firestore (full payload; images included). */

export function sanitizeCompanyForCloud(company) {
  return company ? { ...company } : company
}

export function sanitizeProductForCloud(product) {
  return product ? { ...product } : product
}

export function sanitizeInvoiceForCloud(invoice) {
  if (!invoice) return invoice
  return {
    ...invoice,
    companySnapshot: invoice.companySnapshot
      ? sanitizeCompanyForCloud(invoice.companySnapshot)
      : invoice.companySnapshot,
    lineItems: (invoice.lineItems ?? []).map((line) => ({ ...line })),
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
      return items.map((item) => ({ ...item }))
  }
}
