export function isInvoiceDraft(invoice) {
  return Boolean(invoice?.isDraft)
}

export function isInvoiceInactive(invoice) {
  return Boolean(invoice?.isInactive)
}

/** Published invoices shown on the main list (not draft, not inactive). */
export function publishedInvoices(invoices) {
  return (invoices ?? []).filter((inv) => !inv.isDraft && !inv.isInactive)
}

export function draftInvoices(invoices) {
  return (invoices ?? []).filter((inv) => inv.isDraft)
}

export function inactiveInvoices(invoices) {
  return (invoices ?? []).filter((inv) => !inv.isDraft && inv.isInactive)
}
