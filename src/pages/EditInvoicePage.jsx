import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import InvoiceLineItemsEditor from '../components/InvoiceLineItemsEditor'
import InvoiceStatusControl from '../components/InvoiceStatusControl'
import PageHeader from '../components/PageHeader'
import { inputClass } from '../components/MasterDataForm'
import { updateInvoice } from '../store/slices/invoicesSlice'
import { normalizeLineItems } from '../utils/invoiceLines'
import { formatMoney, invoiceSubtotal, invoiceTotal } from '../utils/invoiceMath'
import { normalizeInvoiceStatus } from '../utils/invoiceStatus'
import { partyDisplayName, resolveCompany, resolveCustomer } from '../utils/invoiceParty'

export default function EditInvoicePage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const invoice = useSelector((s) => s.invoices.items.find((i) => i.id === id))
  const products = useSelector((s) => s.products.items)
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)

  const [status, setStatus] = useState('pending')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [additionalDiscount, setAdditionalDiscount] = useState('0')
  const [lines, setLines] = useState([])

  useEffect(() => {
    if (!invoice) return
    setStatus(normalizeInvoiceStatus(invoice.status))
    setInvoiceDate(invoice.invoiceDate ?? '')
    setNotes(invoice.notes ?? '')
    setAdditionalDiscount(String(invoice.additionalDiscount ?? 0))
    setLines(normalizeLineItems(invoice.lineItems))
  }, [invoice?.id])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        description="Update delivery status, line items, quantities, and totals."
      />

      <InvoiceStatusControl value={status} onChange={setStatus} />

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
          if (!canSubmit) return
          dispatch(
            updateInvoice({
              ...invoice,
              status,
              invoiceDate,
              dueDate: null,
              notes: notes.trim() || null,
              lineItems: lines.map((l) => ({ ...l })),
              additionalDiscount: parseFloat(additionalDiscount) || 0,
            }),
          )
          navigate(`/invoices/${invoice.id}`)
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
          disabled={!products.length}
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
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save changes
          </button>
          <Link to={`/invoices/${invoice.id}`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
