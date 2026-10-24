import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge'
import PageHeader from '../components/PageHeader'
import { partyDisplayName, resolveCompany, resolveCustomer } from '../utils/invoiceParty'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'

export default function InvoiceListPage() {
  const invoices = useSelector((s) => s.invoices.items)
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
            key: 'status',
            label: 'Status',
            render: (row) => <InvoiceStatusBadge status={row.status} />,
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
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
