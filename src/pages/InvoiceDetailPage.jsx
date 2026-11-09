import { PDFDownloadLink } from '@react-pdf/renderer'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import DeliveryStatusLogModal from '../components/DeliveryStatusLogModal'
import InvoiceActivityTimeline from '../components/InvoiceActivityTimeline'
import InvoiceHtmlPreview from '../components/InvoiceHtmlPreview'
import InvoiceStatusControl from '../components/InvoiceStatusControl'
import ShareInvoiceModal from '../components/ShareInvoiceModal'
import PageHeader from '../components/PageHeader'
import InvoiceDocument from '../pdf/InvoiceDocument'
import { removeInvoice, updateInvoice } from '../store/slices/invoicesSlice'
import { confirmDelete, deleteAndSync } from '../utils/confirmDelete'
import { generateInvoicePdfBlob, printPdfBlob } from '../utils/invoicePdf'
import { isInvoiceDraft, isInvoiceInactive } from '../utils/invoiceDraft'
import { normalizeCompanyPhones } from '../utils/companyFields'
import { createPaymentStatusActivityEntry } from '../utils/invoiceActivityLog'
import { canRecordDeliveryProgress, deliveryTotalsForInvoice } from '../utils/invoiceDeliveryLog'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'
import { resolveCompany, resolveCustomer } from '../utils/invoiceParty'
import {
  normalizeDeliveryStatus,
  normalizePaymentStatus,
} from '../utils/invoiceStatus'

function DetailStat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [shareOpen, setShareOpen] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [deliveryLogModal, setDeliveryLogModal] = useState(null)
  const invoice = useSelector((s) => s.invoices.items.find((i) => i.id === id))
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)

  const company = useMemo(
    () => (invoice ? resolveCompany(invoice, companies) : null),
    [companies, invoice],
  )
  const customer = useMemo(
    () => (invoice ? resolveCustomer(invoice, customers) : null),
    [customers, invoice],
  )

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice not found" />
        <Link
          to="/invoices"
          className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
        >
          Back to list
        </Link>
      </div>
    )
  }

  if (isInvoiceDraft(invoice)) {
    return <Navigate to={`/invoices/${invoice.id}/edit`} replace />
  }

  const fileName = `${invoice.invoiceNumber.replace(/\s/g, '_')}.pdf`
  const doc = <InvoiceDocument invoice={invoice} company={company} customer={customer} />
  const total = formatMoney(invoiceTotal(invoice.lineItems, invoice.additionalDiscount))
  const invoiceDateLabel = invoice.invoiceDate
    ? new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString()
    : new Date(invoice.createdAt).toLocaleDateString()
  const totals = deliveryTotalsForInvoice(invoice)
  const paymentStatus = normalizePaymentStatus(invoice.paymentStatus)
  const deliveryStatus = normalizeDeliveryStatus(invoice.deliveryStatus, invoice.status)
  const inactive = isInvoiceInactive(invoice)

  function toggleInactive() {
    dispatch(
      updateInvoice({
        ...invoice,
        isInactive: !inactive,
      }),
    )
    if (!inactive) {
      navigate('/invoices/inactive')
    }
  }

  async function deleteInvoice() {
    if (
      !confirmDelete(
        `Delete invoice ${invoice.invoiceNumber} permanently? This cannot be undone.`,
      )
    ) {
      return
    }
    await deleteAndSync(removeInvoice(invoice.id))
    navigate(inactive ? '/invoices/inactive' : '/invoices')
  }

  async function handlePrintInvoice() {
    setPrinting(true)
    try {
      const blob = await generateInvoicePdfBlob(doc)
      await printPdfBlob(blob)
    } catch (err) {
      window.alert(err?.message ?? 'Could not prepare invoice for printing.')
    } finally {
      setPrinting(false)
    }
  }

  function savePaymentStatus(nextPayment) {
    const normalized = normalizePaymentStatus(nextPayment)
    if (normalized === paymentStatus) return
    const paymentEntry = createPaymentStatusActivityEntry({
      previousPaymentStatus: paymentStatus,
      paymentStatus: normalized,
    })
    dispatch(
      updateInvoice({
        ...invoice,
        paymentStatus: normalized,
        activityLog: paymentEntry
          ? [paymentEntry, ...(invoice.activityLog ?? [])]
          : invoice.activityLog ?? [],
      }),
    )
  }

  function openDeliveryProgressUpdate() {
    setDeliveryLogModal({
      nextDeliveryStatus: deliveryStatus,
      progressUpdate: true,
    })
  }

  function requestDeliveryStatusChange(nextDelivery) {
    const normalized = normalizeDeliveryStatus(nextDelivery)
    if (normalized === deliveryStatus) {
      if (canRecordDeliveryProgress(invoice, deliveryStatus)) {
        openDeliveryProgressUpdate()
      }
      return
    }
    setDeliveryLogModal({ nextDeliveryStatus: normalized, progressUpdate: false })
  }

  function confirmDeliveryLogEntry(entry) {
    const deliveryEntry = { ...entry, type: entry.type ?? 'delivery' }
    dispatch(
      updateInvoice({
        ...invoice,
        deliveryStatus: entry.deliveryStatus,
        status: entry.deliveryStatus,
        deliveryLog: [deliveryEntry, ...(invoice.deliveryLog ?? [])],
        activityLog: [deliveryEntry, ...(invoice.activityLog ?? [])],
      }),
    )
    setDeliveryLogModal(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description="Invoice details, payment & delivery status, and document preview."
        action={
          <div className="flex flex-wrap gap-2">
            {inactive ? (
              <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                Inactive
              </span>
            ) : null}
            <button type="button" className="btn-primary" onClick={() => setShareOpen(true)}>
              Share
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrintInvoice}
              disabled={printing}
            >
              {printing ? 'Preparing…' : 'Print invoice'}
            </button>
            <PDFDownloadLink document={doc} fileName={fileName} className="btn-secondary">
              {({ loading }) => (loading ? 'Preparing…' : 'Download PDF')}
            </PDFDownloadLink>
            <Link to={`/invoices/${invoice.id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <button type="button" className="btn-secondary" onClick={toggleInactive}>
              {inactive ? 'Mark active' : 'Mark inactive'}
            </button>
            <button
              type="button"
              className="btn-secondary text-red-700 hover:text-red-800 dark:text-red-400"
              onClick={deleteInvoice}
            >
              Delete
            </button>
            <Link to={inactive ? '/invoices/inactive' : '/invoices'} className="btn-secondary">
              Back
            </Link>
          </div>
        }
      />

      {inactive ? (
        <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
          This invoice is inactive and hidden from the main invoice list. Mark it active to show it
          again.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white dark:border-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{total}</p>
            <p className="mt-2 text-sm text-slate-300">{invoice.lineItems.length} line items</p>
            <p className="mt-1 text-xs text-slate-400">
              Delivery {totals.delivered}/{totals.ordered} · Pending {totals.pending}
            </p>
          </div>

          <InvoiceStatusControl
            paymentStatus={paymentStatus}
            deliveryStatus={deliveryStatus}
            deliveryProgress={totals}
            onPaymentChange={savePaymentStatus}
            onDeliveryChange={requestDeliveryStatusChange}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DetailStat label="Customer" value={customer?.name ?? '—'} sub={customer?.email} />
            <DetailStat
              label="Your company"
              value={company?.name ?? '—'}
              sub={normalizeCompanyPhones(company).join(' · ') || undefined}
            />
            <DetailStat label="Invoice date" value={invoiceDateLabel} />
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Document preview
            </h3>
            <span className="text-xs text-slate-500">Matches PDF output</span>
          </div>
          <InvoiceHtmlPreview invoice={invoice} company={company} customer={customer} />
        </section>
      </div>

      <InvoiceActivityTimeline
        invoice={invoice}
        paymentStatus={paymentStatus}
        deliveryStatus={deliveryStatus}
        showRecordAction={canRecordDeliveryProgress(invoice, deliveryStatus)}
        onRecordDelivery={openDeliveryProgressUpdate}
      />

      <ShareInvoiceModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fileName={fileName}
        pdfDocument={doc}
        invoice={invoice}
        customer={customer}
        company={company}
      />

      <DeliveryStatusLogModal
        open={Boolean(deliveryLogModal)}
        onClose={() => setDeliveryLogModal(null)}
        onConfirm={confirmDeliveryLogEntry}
        invoice={invoice}
        previousDeliveryStatus={deliveryStatus}
        nextDeliveryStatus={deliveryLogModal?.nextDeliveryStatus ?? deliveryStatus}
        progressUpdate={Boolean(deliveryLogModal?.progressUpdate)}
      />
    </div>
  )
}
