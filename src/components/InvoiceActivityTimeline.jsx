import {
  activityHeadline,
  deliveryShipmentLines,
  formatActivityTimestamp,
  invoiceActivityTimeline,
} from '../utils/invoiceActivityLog'
import {
  deliveryTotalsForInvoice,
  deliveryTotalsFromLogLines,
  formatLogTimestamp,
} from '../utils/invoiceDeliveryLog'
import { deliveryStatusLabel, paymentStatusLabel } from '../utils/invoiceStatus'

function TimelineIcon({ type }) {
  if (type === 'payment_status') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
        ₨
      </span>
    )
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold uppercase text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
      Del
    </span>
  )
}

export default function InvoiceActivityTimeline({
  invoice,
  paymentStatus,
  deliveryStatus,
  onRecordDelivery,
  showRecordAction,
}) {
  const timeline = invoiceActivityTimeline(invoice)
  const totals = deliveryTotalsForInvoice(invoice)
  const latestDelivery = timeline.find((e) => e.type === 'delivery' || e.lines)
  const inventoryLines = latestDelivery?.lines ?? []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Delivery &amp; status log
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Track what was sent, when, and how payment and delivery status changed. Not shown on
              the invoice PDF.
            </p>
          </div>
          {showRecordAction && onRecordDelivery ? (
            <button type="button" className="btn-primary shrink-0" onClick={onRecordDelivery}>
              Record delivery
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <p className="text-xs font-semibold uppercase text-slate-500">Payment</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {paymentStatusLabel(paymentStatus)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <p className="text-xs font-semibold uppercase text-slate-500">Delivery</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {deliveryStatusLabel(deliveryStatus)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <p className="text-xs font-semibold uppercase text-slate-500">Delivered</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {totals.delivered} / {totals.ordered}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <p className="text-xs font-semibold uppercase text-slate-500">Pending</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {totals.pending}
            </p>
          </div>
        </div>
      </div>

      {inventoryLines.length > 0 ? (
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Current delivered inventory
            </h3>
            {showRecordAction && onRecordDelivery ? (
              <button
                type="button"
                className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
                onClick={onRecordDelivery}
              >
                Update quantities
              </button>
            ) : null}
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/80">
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5 text-right">Ordered</th>
                  <th className="px-4 py-2.5 text-right">Delivered</th>
                  <th className="px-4 py-2.5 text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventoryLines.map((line) => (
                  <tr key={line.lineId}>
                    <td className="px-4 py-2.5 font-medium">{line.productName}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{line.orderedQuantity}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                      {line.deliveredQuantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {line.pendingQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="px-6 py-6">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Timeline</h3>
        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No activity yet. Change payment or delivery status above, or record a delivery to build
            your history.
          </p>
        ) : (
          <ol className="relative mt-6 space-y-0 border-l-2 border-slate-200 pl-8 dark:border-slate-700">
            {timeline.map((entry) => {
              const isPayment = entry.type === 'payment_status'
              const shipments = isPayment ? [] : deliveryShipmentLines(entry)
              const entryTotals =
                !isPayment && entry.lines?.length
                  ? deliveryTotalsFromLogLines(entry.lines)
                  : null

              return (
                <li key={entry.id} className="relative pb-10 last:pb-0">
                  <span className="absolute -left-[2.125rem] top-0 flex items-center justify-center">
                    <TimelineIcon type={entry.type} />
                  </span>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {activityHeadline(entry)}
                      </p>
                      <time
                        className="shrink-0 text-xs text-slate-500"
                        dateTime={entry.createdAt}
                        title={formatLogTimestamp(entry.createdAt)}
                      >
                        {formatActivityTimestamp(entry.createdAt)}
                      </time>
                    </div>

                    {isPayment ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Payment status updated to{' '}
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {paymentStatusLabel(entry.paymentStatus)}
                        </span>
                        .
                      </p>
                    ) : null}

                    {shipments.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {shipments.map((s) => (
                          <li
                            key={`${entry.id}-${s.productName}-${s.quantity}`}
                            className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span>{s.label} sent</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {entryTotals ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Running total: {entryTotals.delivered} delivered · {entryTotals.pending}{' '}
                        pending (of {entryTotals.ordered})
                      </p>
                    ) : null}

                    {entry.note ? (
                      <p className="mt-3 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-600 dark:border-slate-600 dark:text-slate-400">
                        {entry.note}
                      </p>
                    ) : null}

                    {!isPayment && entry.lines?.length ? (
                      <details className="mt-3 text-xs text-slate-500">
                        <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-400">
                          Full snapshot after this entry
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {entry.lines.map((line) => (
                            <li key={line.lineId} className="flex justify-between gap-2">
                              <span className="truncate">{line.productName}</span>
                              <span className="shrink-0 tabular-nums">
                                del {line.deliveredQuantity} / {line.orderedQuantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
