import { formatMoney, invoiceSubtotal, invoiceTotal, lineTotal } from '../utils/invoiceMath'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function InvoiceHtmlPreview({ invoice, company, customer }) {
  const sub = invoiceSubtotal(invoice.lineItems)
  const discount = Number(invoice.additionalDiscount) || 0
  const total = invoiceTotal(invoice.lineItems, discount)

  const bankRows = [
    company?.bankName && { label: 'Bank', value: company.bankName },
    company?.accountHolder && { label: 'Account name', value: company.accountHolder },
    company?.accountNumber && { label: 'Account no.', value: company.accountNumber },
  ].filter(Boolean)

  return (
    <article
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 dark:border-slate-800 dark:from-slate-800/80 dark:to-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Invoice
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h2>
          </div>
          {company?.logoDataUrl ? (
            <img
              src={company.logoDataUrl}
              alt=""
              className="h-14 max-w-[120px] object-contain"
            />
          ) : null}
        </div>
        <dl className="mt-5 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-500">Invoice date</dt>
            <dd className="font-medium">{formatDate(invoice.invoiceDate)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</h3>
          <p className="mt-2 font-semibold">{company?.name ?? '—'}</p>
          {company?.address ? (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
              {company.address}
            </p>
          ) : null}
          <div className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">
            {company?.phone ? <p>{company.phone}</p> : null}
            {company?.email ? <p>{company.email}</p> : null}
            {company?.taxId ? <p>Tax ID: {company.taxId}</p> : null}
          </div>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</h3>
          <p className="mt-2 font-semibold">{customer?.name ?? '—'}</p>
          {customer?.address ? (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
              {customer.address}
            </p>
          ) : null}
          <div className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">
            {customer?.phone ? <p>{customer.phone}</p> : null}
            {customer?.email ? <p>{customer.email}</p> : null}
          </div>
        </section>
      </div>

      <div className="px-6 pb-6">
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/80">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Item</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Rate</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.lineItems.map((line, index) => (
                <tr key={line.lineId ?? line.productId ?? index}>
                  <td className="px-3 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {line.imageDataUrl ? (
                        <img
                          src={line.imageDataUrl}
                          alt=""
                          className="h-10 w-10 rounded-md border border-slate-200 object-cover dark:border-slate-600"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                          —
                        </div>
                      )}
                      <span className="font-medium">{line.productName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{line.quantity}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(Number(line.unitPrice))}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatMoney(lineTotal(line))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="flex-1 space-y-3">
            {bankRows.length > 0 ? (
              <div className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
                <p className="text-xs font-semibold uppercase text-slate-500">Payment details</p>
                <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                  {bankRows.map((row) => (
                    <li key={row.label}>
                      <span className="text-slate-500">{row.label}:</span> {row.value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {invoice.notes ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.notes}</p>
            ) : null}
            {company?.signatureDataUrl ? (
              <div className="pt-2">
                <img
                  src={company.signatureDataUrl}
                  alt="Signature"
                  className="h-12 object-contain"
                />
                <p className="mt-1 text-xs text-slate-500">Authorized signature</p>
              </div>
            ) : null}
          </div>
          <div className="w-full max-w-xs space-y-2 text-sm lg:text-right">
            <div className="flex justify-between gap-4 lg:justify-end">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{formatMoney(sub)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between gap-4 lg:justify-end">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium">-{formatMoney(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700 lg:justify-end">
              <span>Amount</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
