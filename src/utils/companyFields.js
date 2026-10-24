export const emptyCompany = {
  name: '',
  email: '',
  phone: '',
  address: '',
  taxId: '',
  website: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  logoDataUrl: '',
  signatureDataUrl: '',
}

export function copyCompanySnapshot(source) {
  if (!source) return null
  const out = {}
  for (const key of Object.keys(emptyCompany)) {
    const val = source[key]
    out[key] = typeof val === 'string' ? val.trim() : (val ?? '')
  }
  if (!out.name) return null
  return out
}
