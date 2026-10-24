import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import InvoiceLineItemsEditor from '../components/InvoiceLineItemsEditor'
import InvoicePartySection from '../components/InvoicePartySection'
import PageHeader from '../components/PageHeader'
import { inputClass } from '../components/MasterDataForm'
import { addInvoice, nextInvoiceNumber } from '../store/slices/invoicesSlice'
import { emptyCompany } from '../utils/companyFields'
import {
  copyCompanySnapshot,
  copyCustomerSnapshot,
  emptyCustomer,
} from '../utils/invoiceParty'
import { formatMoney, invoiceSubtotal, invoiceTotal } from '../utils/invoiceMath'

export default function CreateInvoicePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)
  const products = useSelector((s) => s.products.items)
  const invoices = useSelector((s) => s.invoices.items)

  const [companyMode, setCompanyMode] = useState('select')
  const [customerMode, setCustomerMode] = useState('select')
  const [companyId, setCompanyId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [manualCompany, setManualCompany] = useState(emptyCompany)
  const [manualCustomer, setManualCustomer] = useState(emptyCustomer)

  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [additionalDiscount, setAdditionalDiscount] = useState('0')
  const [lines, setLines] = useState([])

  const subtotal = useMemo(() => invoiceSubtotal(lines), [lines])
  const total = useMemo(
    () => invoiceTotal(lines, additionalDiscount),
    [lines, additionalDiscount],
  )

  const companyValid =
    companyMode === 'select' ? Boolean(companyId) : Boolean(manualCompany.name?.trim())
  const customerValid =
    customerMode === 'select' ? Boolean(customerId) : Boolean(manualCustomer.name?.trim())

  const canSubmit =
    companyValid && customerValid && lines.length > 0 && lines.every((l) => l.quantity > 0)

  const missingProducts = !products.length

  return (
    <div>
      <PageHeader
        title="New invoice"
        description="Choose or type company and customer details, add products, then save."
      />

      {missingProducts ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Add at least one{' '}
          <Link className="font-medium underline" to="/master/product">
            product
          </Link>{' '}
          in master data to pick line items.
        </div>
      ) : null}

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          const invoiceNumber = nextInvoiceNumber(invoices)

          const companySource =
            companyMode === 'select' ? companies.find((c) => c.id === companyId) : manualCompany
          const customerSource =
            customerMode === 'select'
              ? customers.find((c) => c.id === customerId)
              : manualCustomer

          dispatch(
            addInvoice({
              invoiceNumber,
              invoiceDate,
              dueDate: null,
              notes: notes.trim() || null,
              lineItems: lines.map((l) => ({ ...l })),
              additionalDiscount: parseFloat(additionalDiscount) || 0,
              companyId: companyMode === 'select' ? companyId : null,
              customerId: customerMode === 'select' ? customerId : null,
              companySnapshot: copyCompanySnapshot(companySource),
              customerSnapshot: copyCustomerSnapshot(customerSource),
              status: 'pending',
            }),
          )
          navigate('/invoices')
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <InvoicePartySection
            title="Your company"
            variant="company"
            mode={companyMode}
            onModeChange={(m) => {
              setCompanyMode(m)
              if (m === 'select') {
                setManualCompany(emptyCompany)
              } else if (companyId) {
                const row = companies.find((c) => c.id === companyId)
                if (row) setManualCompany({ ...emptyCompany, ...row })
              }
            }}
            selectedId={companyId}
            onSelectId={setCompanyId}
            options={companies}
            manualValues={manualCompany}
            onManualChange={setManualCompany}
          />
          <InvoicePartySection
            title="Customer"
            variant="customer"
            mode={customerMode}
            onModeChange={(m) => {
              setCustomerMode(m)
              if (m === 'select') {
                setManualCustomer(emptyCustomer)
              } else if (customerId) {
                const row = customers.find((c) => c.id === customerId)
                if (row) setManualCustomer({ ...emptyCustomer, ...row })
              }
            }}
            selectedId={customerId}
            onSelectId={setCustomerId}
            options={customers}
            manualValues={manualCustomer}
            onManualChange={setManualCustomer}
          />
          <div className="panel grid gap-4 p-5 sm:grid-cols-2 lg:col-span-2">
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
              <span className="field-label">Notes / terms (optional)</span>
              <textarea
                className={inputClass}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, thank-you message, etc."
              />
            </label>
          </div>
        </div>

        <InvoiceLineItemsEditor products={products} lines={lines} onChange={setLines} />

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

        <button
          type="submit"
          disabled={!canSubmit || missingProducts}
          className="btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create invoice
        </button>
      </form>
    </div>
  )
}
