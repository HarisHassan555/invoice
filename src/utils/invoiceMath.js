export function lineTotal(line) {
  const qty = Number(line.quantity) || 0
  const price = Number(line.unitPrice) || 0
  return qty * price
}

export function invoiceSubtotal(lineItems) {
  return lineItems.reduce((sum, line) => sum + lineTotal(line), 0)
}

export function invoiceTotal(lineItems, additionalDiscount = 0) {
  const sub = invoiceSubtotal(lineItems)
  const discount = Math.max(0, Number(additionalDiscount) || 0)
  return Math.max(0, sub - discount)
}

export function formatMoney(amount) {
  const n = Number(amount) || 0
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
  return `PKR ${formatted}`
}
