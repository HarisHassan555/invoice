import { useCallback, useEffect, useState } from 'react'
import Modal from './Modal'
import { downloadPdfBlob, generateInvoicePdfBlob } from '../utils/invoicePdf'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'
import {
  canSharePdfFile,
  openEmptyEmailCompose,
  sharePdfFile,
} from '../utils/shareInvoicePdf'

export default function ShareInvoiceModal({
  open,
  onClose,
  fileName,
  pdfDocument,
  invoice,
  company,
}) {
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState(null)
  const [hint, setHint] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [fileShareSupported, setFileShareSupported] = useState(false)

  const total = invoice ? formatMoney(invoiceTotal(invoice.lineItems, invoice.additionalDiscount)) : ''
  const subject = `Invoice ${invoice?.invoiceNumber ?? ''}`
  const shareText = `${subject} from ${company?.name ?? 'us'} — Total ${total}`

  const ensurePdf = useCallback(async () => {
    if (pdfBlob) return pdfBlob
    setPreparing(true)
    setError(null)
    try {
      const blob = await generateInvoicePdfBlob(pdfDocument)
      setPdfBlob(blob)
      return blob
    } catch (err) {
      setError(err?.message ?? 'Could not create PDF')
      return null
    } finally {
      setPreparing(false)
    }
  }, [pdfBlob, pdfDocument])

  useEffect(() => {
    if (!open) {
      setPdfBlob(null)
      setError(null)
      setHint(null)
      return
    }
    setPreparing(true)
    setError(null)
    setHint(null)
    generateInvoicePdfBlob(pdfDocument)
      .then((blob) => {
        setPdfBlob(blob)
        const file = new File([blob], fileName, { type: 'application/pdf' })
        setFileShareSupported(canSharePdfFile(file))
      })
      .catch((err) => setError(err?.message ?? 'Could not create PDF'))
      .finally(() => setPreparing(false))
  }, [open, pdfDocument, fileName])

  function pdfFile(blob) {
    return new File([blob], fileName, { type: 'application/pdf' })
  }

  async function shareEmail() {
    setError(null)
    setHint(null)
    const blob = await ensurePdf()
    if (!blob) return

    const file = pdfFile(blob)
    const result = await sharePdfFile(file, { title: subject })

    if (result.ok) return
    if (result.reason === 'cancelled') return

    if (canSharePdfFile(file)) {
      setError('Could not open the share menu. Try again or download the PDF.')
      return
    }

    downloadPdfBlob(blob, fileName)
    openEmptyEmailCompose(subject)
    setHint(
      'Your mail app opened with an empty To field. Attach the PDF from your downloads folder (same filename). On phone, use Chrome or Safari and tap Email again to attach the PDF automatically.',
    )
  }

  async function shareWhatsApp() {
    setError(null)
    setHint(null)
    const blob = await ensurePdf()
    if (!blob) return

    const file = pdfFile(blob)
    const result = await sharePdfFile(file, {
      title: subject,
      text: shareText,
    })

    if (result.ok) return
    if (result.reason === 'cancelled') return

    if (canSharePdfFile(file)) {
      setError('Could not open the share menu. Try again or download the PDF.')
      return
    }

    setError(
      'This browser cannot attach a PDF to WhatsApp directly. Open this page in Chrome (Android) or Safari (iPhone), then tap WhatsApp — choose WhatsApp in the share sheet and the PDF will be attached.',
    )
  }

  async function downloadPdf() {
    const blob = await ensurePdf()
    if (blob) downloadPdfBlob(blob, fileName)
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(shareText)
      setHint('Invoice summary copied.')
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const btnClass =
    'flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800'

  return (
    <Modal open={open} title="Share invoice" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Share <span className="font-medium text-slate-900 dark:text-slate-100">{fileName}</span> as a
        PDF. When your browser supports it, Email and WhatsApp open the system share sheet with the
        invoice file already attached — pick Mail or WhatsApp and choose who to send it to.
      </p>

      {fileShareSupported ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          PDF attach is supported on this device. After you tap Email or WhatsApp, select the app in
          the share menu.
        </p>
      ) : (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          For PDF-in-WhatsApp or PDF-in-email in one step, use Chrome on Android or Safari on iPhone.
          On desktop, Email will download the PDF and open a blank compose window for you to attach
          it.
        </p>
      )}

      {preparing ? <p className="mb-3 text-sm text-slate-500">Preparing PDF…</p> : null}
      {error ? <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {hint ? <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{hint}</p> : null}

      <div className="space-y-2">
        <button type="button" className={btnClass} onClick={shareEmail} disabled={preparing}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            @
          </span>
          <span>
            Email
            <span className="block text-xs font-normal text-slate-500">
              PDF attached when supported · empty To field
            </span>
          </span>
        </button>

        <button type="button" className={btnClass} onClick={shareWhatsApp} disabled={preparing}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">
            WA
          </span>
          <span>
            WhatsApp
            <span className="block text-xs font-normal text-slate-500">
              Share sheet with PDF · forward to any contact
            </span>
          </span>
        </button>

        <button type="button" className={btnClass} onClick={downloadPdf} disabled={preparing}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600">
            ↓
          </span>
          <span>Download PDF only</span>
        </button>

        <button type="button" className={btnClass} onClick={copySummary} disabled={preparing}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600">
            ⧉
          </span>
          <span>Copy invoice summary</span>
        </button>
      </div>
    </Modal>
  )
}
