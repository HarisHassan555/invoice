import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import { removeInvoice, updateInvoice } from '../store/slices/invoicesSlice'
import { inactiveInvoices } from '../utils/invoiceDraft'
import { confirmDelete, deleteAndSync } from '../utils/confirmDelete'
import { formatMoney, invoiceTotal } from '../utils/invoiceMath'
import { partyDisplayName, resolveCompany, resolveCustomer } from '../utils/invoiceParty'

export default function InactiveInvoiceListPage() {
  const dispatch = useDispatch()
  const allInvoices = useSelector((s) => s.invoices.items)
  const companies = useSelector((s) => s.companies.items)
  const customers = useSelector((s) => s.customers.items)

  const rows = useMemo(() => inactiveInvoices(allInvoices), [allInvoices])

  const companyName = (row) => partyDisplayName(resolveCompany(row, companies)) || '—'
  const customerName = (row) => partyDisplayName(resolveCustomer(row, customers)) || '—'

  return (
    <div>
      <PageHeader
        title="Inactive invoices"
        description="Archived invoices hidden from the main list. Restore or delete them here."
      />
      <DataTable
        emptyMessage="No inactive invoices."
        rows={rows}
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
                  to={`/invoices/${row.id}`}
                  className="btn-secondary inline-flex px-3 py-1.5"
                >
                  Open
                </Link>
                <button
                  type="button"
                  className="btn-primary inline-flex px-3 py-1.5"
                  onClick={() =>
                    dispatch(
                      updateInvoice({
                        ...row,
                        isInactive: false,
                      }),
                    )
                  }
                >
                  Mark active
                </button>
                <button
                  type="button"
                  className="btn-secondary inline-flex px-3 py-1.5 text-red-700 dark:text-red-400"
                  onClick={() => {
                    if (
                      !confirmDelete(
                        `Delete invoice ${row.invoiceNumber} permanently? This cannot be undone.`,
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
