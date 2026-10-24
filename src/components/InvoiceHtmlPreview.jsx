import { formatAmountInWords } from '../utils/amountInWords'
import {
  INVOICE_AUTHORIZED_SIGNATURES_LABEL,
  INVOICE_ENQUIRY_FOOTER,
} from '../utils/invoiceDocumentCopy'
import { formatMoney, invoiceSubtotal, invoiceTotal, lineTotal } from '../utils/invoiceMath'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function PartyBlock({ title, name, address, phone, email }) {
  return (
    <section>
      <h3 className="border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:text-slate-300">
        {title}
      </h3>
      <p className="mt-3 font-semibold text-slate-900 dark:text-slate-100">{name ?? '—'}</p>
      {address ? (
        <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
          {address}
        </p>
      ) : null}
      <div className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">
        {phone ? <p>{phone}</p> : null}
        {email ? <p>{email}</p> : null}
      </div>
    </section>
  )
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
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
    >
      <header className="border-b border-slate-300 px-6 py-5 dark:border-slate-600">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {company?.logoDataUrl ? (
              <img
                src={company.logoDataUrl}
                alt=""
                className="h-16 w-16 shrink-0 object-contain"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{company?.name ?? '—'}</p>
              {company?.address ? (
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
                  {company.address}
                </p>
              ) : null}
              <div className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">
                {company?.phone ? <p>{company.phone}</p> : null}
                {company?.email ? <p>{company.email}</p> : null}
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white">
              INVOICE
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-end gap-2">
                <dt className="text-slate-500">Invoice #</dt>
                <dd className="font-semibold">{invoice.invoiceNumber}</dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-slate-500">Date</dt>
                <dd className="font-semibold">{formatDate(invoice.invoiceDate)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <div className="grid gap-8 border-b border-slate-200 px-6 py-5 sm:grid-cols-2 dark:border-slate-700">
        <PartyBlock
          title="Billed by"
          name={company?.name}
          address={company?.address}
          phone={company?.phone}
          email={company?.email}
        />
        <PartyBlock
          title="Billed to"
          name={customer?.name}
          address={customer?.address}
          phone={customer?.phone}
          email={customer?.email}
        />
      </div>

      <div className="px-6 py-5">
        <table className="min-w-full border border-slate-300 text-sm dark:border-slate-600">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="border-b border-slate-300 px-3 py-2.5 dark:border-slate-600">S.No</th>
              <th className="border-b border-slate-300 px-3 py-2.5 dark:border-slate-600">Item</th>
              <th className="border-b border-slate-300 px-3 py-2.5 text-right dark:border-slate-600">
                Qty
              </th>
              <th className="border-b border-slate-300 px-3 py-2.5 text-right dark:border-slate-600">
                Rate
              </th>
              <th className="border-b border-slate-300 px-3 py-2.5 text-right dark:border-slate-600">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((line, index) => (
              <tr
                key={line.lineId ?? line.productId ?? index}
                className="border-b border-slate-200 dark:border-slate-700"
              >
                <td className="px-3 py-2.5 text-slate-600">{index + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    {line.imageDataUrl ? (
                      <img
                        src={line.imageDataUrl}
                        alt=""
                        className="h-9 w-9 rounded border border-slate-200 object-cover dark:border-slate-600"
                      />
                    ) : null}
                    <span className="font-medium">{line.productName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">{line.quantity}</td>
                <td className="px-3 py-2.5 text-right">{formatMoney(Number(line.unitPrice))}</td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {formatMoney(lineTotal(line))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex flex-col gap-6 border-t border-slate-200 pt-5 lg:flex-row lg:items-start lg:justify-between dark:border-slate-700">
          <div className="min-w-0 flex-1 pr-0 lg:pr-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Amount in words
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
              {formatAmountInWords(total)}
            </p>
          </div>
          <div className="w-full max-w-[240px] shrink-0 space-y-1.5 text-sm lg:text-right">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">{formatMoney(sub)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Discount</span>
                <span className="font-medium">-{formatMoney(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-slate-900 pt-2 text-base font-bold dark:border-slate-300">
              <span>Amount</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        {bankRows.length > 0 ? (
          <div className="mt-5 border border-slate-200 p-4 text-sm dark:border-slate-700">
            <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
              Payment details
            </p>
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
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{invoice.notes}</p>
        ) : null}
      </div>

      <footer className="border-t border-slate-300 bg-slate-50 px-6 py-5 dark:border-slate-600 dark:bg-slate-800/40">
        {company?.signatureDataUrl ? (
          <img
            src={company.signatureDataUrl}
            alt="Signature"
            className="mt-3 h-12 object-contain object-left"
          />
        ) : (
          <div className="mt-8 h-8" />
        )}
        <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          {INVOICE_AUTHORIZED_SIGNATURES_LABEL}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {INVOICE_ENQUIRY_FOOTER}
        </p>
      </footer>
    </article>
  )
}
