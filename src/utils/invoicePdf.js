import { pdf } from '@react-pdf/renderer'

export async function generateInvoicePdfBlob(documentElement) {
  return pdf(documentElement).toBlob()
}

export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
