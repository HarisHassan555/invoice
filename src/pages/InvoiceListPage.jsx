import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import { DeliveryStatusBadge, PaymentStatusBadge } from '../components/InvoiceStatusBadge'
import PageHeader from '../components/PageHeader'
import { removeInvoice, updateInvoice } from '../store/slices/invoicesSlice'
import { publishedInvoices } from '../utils/invoiceDraft'
import { partyDisplayName, resolveCompany, resolveCustomer } from '../utils/invoiceParty'
import { deliveryTotalsForInvoice } from '../utils/invoiceDeliveryLog'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'

export default function InvoiceListPage() {
  const dispatch = useDispatch()
  const allInvoices = useSelector((s) => s.invoices.items)
  const invoices = useMemo(() => publishedInvoices(allInvoices), [allInvoices])
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)

  const companyName = (row) => partyDisplayName(resolveCompany(row, companies))
  const customerName = (row) => partyDisplayName(resolveCustomer(row, customers))

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="All invoices you have created."
        action={
          <Link to="/invoices/new" className="btn-primary inline-flex">
            New invoice
          </Link>
        }
      />
      <DataTable
        emptyMessage="No invoices yet. Create your first invoice."
        rows={invoices}
        columns={[
          { key: 'invoiceNumber', label: 'Number' },
          {
            key: 'invoiceDate',
            label: 'Date',
            render: (row) =>
              row.invoiceDate
                ? new Date(row.invoiceDate + 'T00:00:00').toLocaleDateString()
                : new Date(row.createdAt).toLocaleDateString(),
          },
          {
            key: 'paymentStatus',
            label: 'Payment',
            render: (row) => <PaymentStatusBadge status={row.paymentStatus} />,
          },
          {
            key: 'deliveryStatus',
            label: 'Delivery',
            render: (row) => {
              const totals = deliveryTotalsForInvoice(row)
              return (
                <div className="space-y-1">
                  <DeliveryStatusBadge
                    status={row.deliveryStatus}
                    legacyStatus={row.status}
                  />
                  {totals.ordered > 0 ? (
                    <p className="text-[11px] text-slate-500">
                      {totals.delivered}/{totals.ordered} delivered · {totals.pending} pending
                    </p>
                  ) : null}
                </div>
              )
            },
          },
          {
            key: 'company',
            label: 'Company',
            render: (row) => companyName(row),
          },
          {
            key: 'customer',
            label: 'Customer',
            render: (row) => customerName(row),
          },
          {
            key: 'total',
            label: 'Total',
            render: (row) =>
              formatMoney(invoiceTotal(row.lineItems, row.additionalDiscount)),
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  to={`/invoices/${row.id}/edit`}
                  className="btn-secondary inline-flex px-3 py-1.5"
                >
                  Edit
                </Link>
                <Link
                  to={`/invoices/${row.id}`}
                  className="btn-secondary inline-flex px-3 py-1.5"
                >
                  Details
                </Link>
                <button
                  type="button"
                  className="btn-secondary inline-flex px-3 py-1.5"
                  onClick={() =>
                    dispatch(
                      updateInvoice({
                        ...row,
                        isInactive: true,
                      }),
                    )
                  }
                >
                  Inactive
                </button>
                <button
                  type="button"
                  className="btn-secondary inline-flex px-3 py-1.5 text-red-700 dark:text-red-400"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete invoice ${row.invoiceNumber} permanently? This cannot be undone.`,
                      )
                    ) {
                      dispatch(removeInvoice(row.id))
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
