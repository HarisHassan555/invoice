import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import InvoiceLineItemsEditor from '../components/InvoiceLineItemsEditor'
import InvoicePartySection from '../components/InvoicePartySection'
import PageHeader from '../components/PageHeader'
import ProductFormModal from '../components/ProductFormModal'
import { inputClass } from '../components/MasterDataForm'
import { addInvoice, nextDraftNumber, nextInvoiceNumber } from '../store/slices/invoicesSlice'
import { productToLine } from '../utils/invoiceLines'
import { companyPhonesForForm, emptyCompany } from '../utils/companyFields'
import {
  copyCompanySnapshot,
  copyCustomerSnapshot,
  emptyCustomer,
} from '../utils/invoiceParty'
import { formatMoney, invoiceSubtotal, invoiceTotal } from '../utils/invoiceMath'

function buildInvoicePayload({
  companyMode,
  customerMode,
  companyId,
  customerId,
  manualCompany,
  manualCustomer,
  companies,
  customers,
  invoiceDate,
  notes,
  lines,
  additionalDiscount,
  isDraft,
}) {
  const companySource =
    companyMode === 'select' ? companies.find((c) => c.id === companyId) : manualCompany
  const customerSource =
    customerMode === 'select' ? customers.find((c) => c.id === customerId) : manualCustomer

  return {
    invoiceDate,
    dueDate: null,
    notes: notes.trim() || null,
    lineItems: lines.map((l) => ({ ...l })),
    additionalDiscount: parseFloat(additionalDiscount) || 0,
    companyId: companyMode === 'select' ? companyId || null : null,
    customerId: customerMode === 'select' ? customerId || null : null,
    companySnapshot: companySource ? copyCompanySnapshot(companySource) : null,
    customerSnapshot: customerSource ? copyCustomerSnapshot(customerSource) : null,
    paymentStatus: 'payment_pending',
    deliveryStatus: 'pending_delivery',
    status: 'pending_delivery',
    isDraft,
  }
}

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
  const [productModalOpen, setProductModalOpen] = useState(false)

  const subtotal = useMemo(() => invoiceSubtotal(lines), [lines])
  const total = useMemo(
    () => invoiceTotal(lines, additionalDiscount),
    [lines, additionalDiscount],
  )

  const companyValid =
    companyMode === 'select' ? Boolean(companyId) : Boolean(manualCompany.name?.trim())
  const customerValid =
    customerMode === 'select' ? Boolean(customerId) : Boolean(manualCustomer.name?.trim())

  const canPublish =
    companyValid && customerValid && lines.length > 0 && lines.every((l) => l.quantity > 0)

  function applyCompanyInvoiceDefaults(row) {
    if (!row) {
      setNotes('')
      return
    }
    setNotes(row.defaultInvoiceNotes ?? '')
  }

  function selectCompany(id) {
    setCompanyId(id)
    if (!id) {
      applyCompanyInvoiceDefaults(null)
      return
    }
    const row = companies.find((c) => c.id === id)
    if (row) {
      setManualCompany({
        ...emptyCompany,
        ...row,
        phones: companyPhonesForForm(row),
      })
      applyCompanyInvoiceDefaults(row)
    }
  }

  function saveDraft() {
    dispatch(
      addInvoice({
        ...buildInvoicePayload({
          companyMode,
          customerMode,
          companyId,
          customerId,
          manualCompany,
          manualCustomer,
          companies,
          customers,
          invoiceDate,
          notes,
          lines,
          additionalDiscount,
          isDraft: true,
        }),
        invoiceNumber: nextDraftNumber(invoices),
      }),
    )
    navigate('/invoices/drafts')
  }

  function publishInvoice(e) {
    e.preventDefault()
    if (!canPublish) return
    dispatch(
      addInvoice({
        ...buildInvoicePayload({
          companyMode,
          customerMode,
          companyId,
          customerId,
          manualCompany,
          manualCustomer,
          companies,
          customers,
          invoiceDate,
          notes,
          lines,
          additionalDiscount,
          isDraft: false,
        }),
        invoiceNumber: nextInvoiceNumber(invoices),
      }),
    )
    navigate('/invoices')
  }

  return (
    <div>
      <PageHeader
        title="New invoice"
        description="Choose or type company and customer details, add products, then save or publish."
      />

      <form className="mt-6 space-y-6" onSubmit={publishInvoice}>
        <div className="grid gap-4 lg:grid-cols-2">
          <InvoicePartySection
            title="Your company"
            variant="company"
            mode={companyMode}
            onModeChange={(m) => {
              setCompanyMode(m)
              if (m === 'select') {
                setManualCompany(emptyCompany)
                if (companyId) {
                  const row = companies.find((c) => c.id === companyId)
                  applyCompanyInvoiceDefaults(row)
                } else {
                  applyCompanyInvoiceDefaults(null)
                }
              } else if (companyId) {
                const row = companies.find((c) => c.id === companyId)
                if (row) {
                  setManualCompany({
                    ...emptyCompany,
                    ...row,
                    phones: companyPhonesForForm(row),
                  })
                  applyCompanyInvoiceDefaults(row)
                }
              }
            }}
            selectedId={companyId}
            onSelectId={selectCompany}
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
                placeholder="Prefilled from company master data when you pick a company; edit as needed."
              />
            </label>
          </div>
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canPublish}
            className="btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create invoice
          </button>
          <button type="button" className="btn-secondary px-5 py-2.5" onClick={saveDraft}>
            Save draft
          </button>
          <Link to="/invoices/drafts" className="text-sm font-medium text-slate-600 underline dark:text-slate-400">
            View draft invoices
          </Link>
        </div>
      </form>

      <ProductFormModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onCreated={(product) => {
          setLines((prev) => [...prev, productToLine(product)])
        }}
      />
    </div>
  )
}
