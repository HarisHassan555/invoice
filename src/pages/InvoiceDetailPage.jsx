import { PDFDownloadLink } from '@react-pdf/renderer'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import InvoiceHtmlPreview from '../components/InvoiceHtmlPreview'
import InvoiceStatusControl from '../components/InvoiceStatusControl'
import ShareInvoiceModal from '../components/ShareInvoiceModal'
import PageHeader from '../components/PageHeader'
import InvoiceDocument from '../pdf/InvoiceDocument'
import { updateInvoice } from '../store/slices/invoicesSlice'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'
import { resolveCompany, resolveCustomer } from '../utils/invoiceParty'

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
  const [shareOpen, setShareOpen] = useState(false)
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

  const fileName = `${invoice.invoiceNumber.replace(/\s/g, '_')}.pdf`
  const doc = <InvoiceDocument invoice={invoice} company={company} customer={customer} />
  const total = formatMoney(invoiceTotal(invoice.lineItems, invoice.additionalDiscount))
  const invoiceDateLabel = invoice.invoiceDate
    ? new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString()
    : new Date(invoice.createdAt).toLocaleDateString()

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description="Invoice details, delivery status, and document preview."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => setShareOpen(true)}>
              Share
            </button>
            <PDFDownloadLink document={doc} fileName={fileName} className="btn-secondary">
              {({ loading }) => (loading ? 'Preparing…' : 'Download PDF')}
            </PDFDownloadLink>
            <Link to={`/invoices/${invoice.id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <Link to="/invoices" className="btn-secondary">
              Back
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white dark:border-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{total}</p>
            <p className="mt-2 text-sm text-slate-300">{invoice.lineItems.length} line items</p>
          </div>

          <InvoiceStatusControl
            value={invoice.status}
            onChange={(status) => {
              dispatch(updateInvoice({ ...invoice, status }))
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DetailStat label="Customer" value={customer?.name ?? '—'} sub={customer?.email} />
            <DetailStat label="Your company" value={company?.name ?? '—'} sub={company?.phone} />
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

      <ShareInvoiceModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fileName={fileName}
        pdfDocument={doc}
        invoice={invoice}
        customer={customer}
        company={company}
      />
    </div>
  )
}
