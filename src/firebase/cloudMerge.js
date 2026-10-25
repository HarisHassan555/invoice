function mergeCompany(local, remote) {
  if (!remote && !local) return null
  if (!remote) return local
  if (!local) return remote
  return {
    ...remote,
    logoDataUrl: remote.logoDataUrl || local.logoDataUrl || '',
    signatureDataUrl: remote.signatureDataUrl || local.signatureDataUrl || '',
  }
}

function mergeProduct(local, remote) {
  if (!remote && !local) return null
  if (!remote) return local
  if (!local) return remote
  return {
    ...remote,
    imageDataUrl: remote.imageDataUrl || local.imageDataUrl || '',
  }
}

function mergeInvoiceLine(localLine, remoteLine) {
  if (!remoteLine && !localLine) return null
  if (!remoteLine) return localLine
  if (!localLine) return remoteLine
  return {
    ...remoteLine,
    imageDataUrl: remoteLine.imageDataUrl || localLine.imageDataUrl || '',
  }
}

function mergeInvoice(local, remote) {
  if (!remote && !local) return null
  if (!remote) return local
  if (!local) return remote

  const remoteLines = remote.lineItems ?? []
  const localLines = local.lineItems ?? []
  const lineKey = (l) => l.lineId ?? l.productId ?? l.productName

  const remoteLineMap = new Map(remoteLines.map((l) => [lineKey(l), l]))
  const localLineMap = new Map(localLines.map((l) => [lineKey(l), l]))
  const lineIds = new Set([...remoteLineMap.keys(), ...localLineMap.keys()])

  const lineItems = [...lineIds]
    .map((key) => mergeInvoiceLine(localLineMap.get(key), remoteLineMap.get(key)))
    .filter(Boolean)

  return {
    ...remote,
    companySnapshot: mergeCompany(local.companySnapshot, remote.companySnapshot),
    lineItems,
  }
}

function mergeById(localItems, remoteItems, mergeOne) {
  const remoteMap = new Map((remoteItems ?? []).map((i) => [i.id, i]))
  const localMap = new Map((localItems ?? []).map((i) => [i.id, i]))
  const ids = new Set([...remoteMap.keys(), ...localMap.keys()])
  return [...ids].map((id) => mergeOne(localMap.get(id), remoteMap.get(id))).filter(Boolean)
}

export function mergeRemoteWithLocal(localState, remoteState) {
  return {
    companies: mergeById(localState.companies.items, remoteState.companies, mergeCompany),
    customers: mergeById(localState.customers.items, remoteState.customers, (a, b) => b ?? a),
    products: mergeById(localState.products.items, remoteState.products, mergeProduct),
    invoices: mergeById(localState.invoices.items, remoteState.invoices, mergeInvoice).sort(
      (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
    ),
  }
}
