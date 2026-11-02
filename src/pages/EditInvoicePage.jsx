import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DeliveryStatusLogModal from '../components/DeliveryStatusLogModal'
import InvoiceLineItemsEditor from '../components/InvoiceLineItemsEditor'
import InvoiceStatusControl from '../components/InvoiceStatusControl'
import ProductFormModal from '../components/ProductFormModal'
import PageHeader from '../components/PageHeader'
import { inputClass } from '../components/MasterDataForm'
import { nextInvoiceNumber, removeInvoice, updateInvoice } from '../store/slices/invoicesSlice'
import { isInvoiceDraft, isInvoiceInactive } from '../utils/invoiceDraft'
import { createPaymentStatusActivityEntry } from '../utils/invoiceActivityLog'
import { canRecordDeliveryProgress, deliveryTotalsForInvoice } from '../utils/invoiceDeliveryLog'
import { normalizeLineItems, productToLine } from '../utils/invoiceLines'
import { formatMoney, invoiceSubtotal, invoiceTotal } from '../utils/invoiceMath'
import { normalizeDeliveryStatus, normalizePaymentStatus } from '../utils/invoiceStatus'
import { partyDisplayName, resolveCompany, resolveCustomer } from '../utils/invoiceParty'

export default function EditInvoicePage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const invoice = useSelector((s) => s.invoices.items.find((i) => i.id === id))
  const allInvoices = useSelector((s) => s.invoices.items)
  const products = useSelector((s) => s.products.items)
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)

  const [paymentStatus, setPaymentStatus] = useState('payment_pending')
  const [deliveryStatus, setDeliveryStatus] = useState('pending_delivery')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [additionalDiscount, setAdditionalDiscount] = useState('0')
  const [lines, setLines] = useState([])
  const [deliveryLogModal, setDeliveryLogModal] = useState(null)
  const [productModalOpen, setProductModalOpen] = useState(false)

  const isDraft = invoice ? isInvoiceDraft(invoice) : false
  const inactive = invoice ? isInvoiceInactive(invoice) : false

  useEffect(() => {
    if (!invoice) return
    setPaymentStatus(normalizePaymentStatus(invoice.paymentStatus))
    setDeliveryStatus(normalizeDeliveryStatus(invoice.deliveryStatus, invoice.status))
    setInvoiceDate(invoice.invoiceDate ?? '')
    setNotes(invoice.notes ?? '')
    setAdditionalDiscount(String(invoice.additionalDiscount ?? 0))
    setLines(normalizeLineItems(invoice.lineItems))
  }, [invoice?.id])

  const deliveryProgress = useMemo(
    () => (invoice ? deliveryTotalsForInvoice(invoice) : { ordered: 0, delivered: 0, pending: 0 }),
    [invoice],
  )

  const subtotal = useMemo(() => invoiceSubtotal(lines), [lines])
  const total = useMemo(
    () => invoiceTotal(lines, additionalDiscount),
    [lines, additionalDiscount],
  )

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice not found" />
        <Link to="/invoices" className="text-sm underline">Back to list</Link>
      </div>
    )
  }

  const company = resolveCompany(invoice, companies)
  const customer = resolveCustomer(invoice, customers)
  const canSubmit = lines.length > 0 && lines.every((l) => l.quantity > 0)
  const canPublish = canSubmit && Boolean(invoice.companySnapshot?.name || company?.name) &&
    Boolean(invoice.customerSnapshot?.name || customer?.name)

  function persistInvoice({ publish = false } = {}) {
    const finalDelivery = normalizeDeliveryStatus(deliveryStatus)
    const nextPayment = normalizePaymentStatus(paymentStatus)
    const paymentEntry = createPaymentStatusActivityEntry({
      previousPaymentStatus: invoice.paymentStatus,
      paymentStatus: nextPayment,
    })
    const payload = {
      ...invoice,
      paymentStatus: nextPayment,
      deliveryStatus: finalDelivery,
      status: finalDelivery,
      invoiceDate,
      dueDate: null,
      notes: notes.trim() || null,
      lineItems: lines.map((l) => ({ ...l })),
      additionalDiscount: parseFloat(additionalDiscount) || 0,
    }

    if (paymentEntry) {
      payload.activityLog = [paymentEntry, ...(invoice.activityLog ?? [])]
    }

    if (publish && isDraft) {
      payload.isDraft = false
      payload.invoiceNumber = nextInvoiceNumber(allInvoices)
    } else if (isDraft) {
      payload.isDraft = true
    }

    dispatch(updateInvoice(payload))

    if (publish && isDraft) {
      navigate(`/invoices/${invoice.id}`)
    } else if (isDraft) {
      navigate('/invoices/drafts')
    } else {
      navigate(`/invoices/${invoice.id}`)
    }
  }

  function openDeliveryProgressUpdate() {
    setDeliveryLogModal({
      nextDeliveryStatus: deliveryStatus,
      progressUpdate: true,
    })
  }

  function requestDeliveryStatusChange(nextStatus) {
    const normalized = normalizeDeliveryStatus(nextStatus)
    if (normalized === deliveryStatus) {
      if (invoice && canRecordDeliveryProgress(invoice, deliveryStatus)) {
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
    setDeliveryStatus(entry.deliveryStatus)
    setDeliveryLogModal(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isDraft ? `Draft ${invoice.invoiceNumber}` : `Edit ${invoice.invoiceNumber}`}
        description={
          isDraft
            ? 'Finish line items and details, then publish to create a numbered invoice.'
            : 'Update payment and delivery status, line items, and totals.'
        }
      />

      {isDraft ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          This is a draft. It will not appear in All invoices until you publish it.
        </div>
      ) : (
        <InvoiceStatusControl
          paymentStatus={paymentStatus}
          deliveryStatus={deliveryStatus}
          deliveryProgress={deliveryProgress}
          onPaymentChange={setPaymentStatus}
          onDeliveryChange={requestDeliveryStatusChange}
        />
      )}

      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Company</p>
          <p className="mt-1 text-sm font-medium">{partyDisplayName(company)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
          <p className="mt-1 text-sm font-medium">{partyDisplayName(customer)}</p>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (isDraft) return
          if (!canSubmit) return
          persistInvoice()
        }}
      >
        <div className="panel grid gap-4 p-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Invoice date</span>
            <input
              type="date"
              className={inputClass}
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Notes / terms</span>
            <textarea
              className={inputClass}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <InvoiceLineItemsEditor
          products={products}
          lines={lines}
          onChange={setLines}
          onRequestCreateProduct={() => setProductModalOpen(true)}
        />

        <div className="panel flex flex-col items-end gap-2 p-6 text-sm">
          <div className="flex w-full max-w-xs justify-between">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="font-medium">{formatMoney(subtotal)}</span>
          </div>
          <label className="flex w-full max-w-xs items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Additional discount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="field-input w-28 py-1 text-right"
              value={additionalDiscount}
              onChange={(e) => setAdditionalDiscount(e.target.value)}
            />
          </label>
          <div className="flex w-full max-w-xs justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <>
              <button
                type="button"
                disabled={!canPublish}
                className="btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!canPublish) return
                  persistInvoice({ publish: true })
                }}
              >
                Publish invoice
              </button>
              <button
                type="button"
                className="btn-secondary px-5 py-2.5"
                onClick={() => persistInvoice()}
              >
                Save draft
              </button>
              <Link to="/invoices/drafts" className="btn-secondary">
                Back to drafts
              </Link>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={!canSubmit}
                className="btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save changes
              </button>
              <button
                type="button"
                className="btn-secondary px-5 py-2.5"
                onClick={() => {
                  dispatch(
                    updateInvoice({
                      ...invoice,
                      isInactive: !inactive,
                    }),
                  )
                  navigate(inactive ? `/invoices/${invoice.id}` : '/invoices/inactive')
                }}
              >
                {inactive ? 'Mark active' : 'Mark inactive'}
              </button>
              <button
                type="button"
                className="btn-secondary px-5 py-2.5 text-red-700 dark:text-red-400"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Delete invoice ${invoice.invoiceNumber} permanently? This cannot be undone.`,
                    )
                  ) {
                    return
                  }
                  dispatch(removeInvoice(invoice.id))
                  navigate(inactive ? '/invoices/inactive' : '/invoices')
                }}
              >
                Delete
              </button>
              <Link to={`/invoices/${invoice.id}`} className="btn-secondary">
                Cancel
              </Link>
            </>
          )}
        </div>
      </form>

      <ProductFormModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onCreated={(product) => {
          setLines((prev) => [...prev, productToLine(product)])
        }}
      />

      {!isDraft ? (
        <DeliveryStatusLogModal
          open={Boolean(deliveryLogModal)}
          onClose={() => setDeliveryLogModal(null)}
          onConfirm={confirmDeliveryLogEntry}
          invoice={invoice}
          previousDeliveryStatus={deliveryStatus}
          nextDeliveryStatus={deliveryLogModal?.nextDeliveryStatus ?? deliveryStatus}
          progressUpdate={Boolean(deliveryLogModal?.progressUpdate)}
        />
      ) : null}
    </div>
  )
}
