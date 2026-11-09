import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import { removeInvoice } from '../store/slices/invoicesSlice'
import { draftInvoices } from '../utils/invoiceDraft'
import { confirmDelete, deleteAndSync } from '../utils/confirmDelete'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'
import { partyDisplayName, resolveCompany, resolveCustomer } from '../utils/invoiceParty'

export default function DraftInvoiceListPage() {
  const allInvoices = useSelector((s) => s.invoices.items)
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)

  const drafts = useMemo(() => draftInvoices(allInvoices), [allInvoices])

  const companyName = (row) => partyDisplayName(resolveCompany(row, companies)) || '—'
  const customerName = (row) => partyDisplayName(resolveCustomer(row, customers)) || '—'

  return (
    <div>
      <PageHeader
        title="Draft invoices"
        description="Incomplete invoices saved for later. Open a draft to keep editing or publish it."
        action={
          <Link to="/invoices/new" className="btn-primary inline-flex">
            New invoice
          </Link>
        }
      />
      <DataTable
        emptyMessage="No drafts yet. Use Save draft while creating an invoice."
        rows={drafts}
        columns={[
          { key: 'invoiceNumber', label: 'Draft ref' },
          {
            key: 'updated',
            label: 'Last saved',
            render: (row) =>
              new Date(row.updatedAt ?? row.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
          },
          {
            key: 'invoiceDate',
            label: 'Invoice date',
            render: (row) =>
              row.invoiceDate
                ? new Date(row.invoiceDate + 'T00:00:00').toLocaleDateString()
                : '—',
          },
          {
            key: 'customer',
            label: 'Customer',
            render: (row) => customerName(row),
          },
          {
            key: 'company',
            label: 'Company',
            render: (row) => companyName(row),
          },
          {
            key: 'lines',
            label: 'Items',
            render: (row) => `${row.lineItems?.length ?? 0} lines`,
          },
          {
            key: 'total',
            label: 'Total',
            render: (row) =>
              row.lineItems?.length
                ? formatMoney(invoiceTotal(row.lineItems, row.additionalDiscount))
                : '—',
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Link
                  to={`/invoices/${row.id}/edit`}
                  className="btn-primary inline-flex px-3 py-1.5"
                >
                  Continue
                </Link>
                <button
                  type="button"
                  className="btn-secondary inline-flex px-3 py-1.5 text-red-700 dark:text-red-400"
                  onClick={() => {
                    if (
                      !confirmDelete(
                        `Delete draft ${row.invoiceNumber}? This cannot be undone.`,
                      )
                    ) {
                      return
                    }
                    void deleteAndSync(removeInvoice(row.id))
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
