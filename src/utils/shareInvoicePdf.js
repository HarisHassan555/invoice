/**
 * Share a PDF file via the system share sheet (WhatsApp, Mail, etc.) when the browser supports it.
 */

export function canSharePdfFile(file) {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export async function sharePdfFile(file, { title, text } = {}) {
  const payloads = [
    { files: [file], title, text },
    { files: [file], title },
    { files: [file] },
  ].filter((p) => {
    try {
      return navigator.canShare(p)
    } catch {
      return false
    }
  })

  if (!payloads.length) {
    return { ok: false, reason: 'unsupported' }
  }

  try {
    await navigator.share(payloads[0])
    return { ok: true }
  } catch (err) {
    if (err?.name === 'AbortError') return { ok: false, reason: 'cancelled' }
    return { ok: false, reason: err?.message ?? 'share_failed' }
  }
}

export function openEmptyEmailCompose(subject) {
  const q = `?subject=${encodeURIComponent(subject)}`
  window.location.href = `mailto:${q}`
}
