import { useEffect, useState } from 'react'
import Modal from './Modal'
import { inputClass } from './MasterDataForm'
import {
  createDeliveryLogEntry,
  defaultLogLinesForStatus,
  latestDeliveryLogEntry,
} from '../utils/invoiceDeliveryLog'
import { deliveryStatusLabel, normalizeDeliveryStatus } from '../utils/invoiceStatus'

function syncPending(line) {
  const orderedQuantity = Number(line.orderedQuantity) || 0
  const deliveredQuantity = Math.min(
    Math.max(0, Math.floor(Number(line.deliveredQuantity) || 0)),
    orderedQuantity,
  )
  return {
    ...line,
    deliveredQuantity,
    pendingQuantity: Math.max(0, orderedQuantity - deliveredQuantity),
  }
}

export default function DeliveryStatusLogModal({
  open,
  onClose,
  onConfirm,
  invoice,
  previousDeliveryStatus,
  nextDeliveryStatus,
  progressUpdate = false,
}) {
  const [lines, setLines] = useState([])
  const [note, setNote] = useState('')
  const [priorByLine, setPriorByLine] = useState(new Map())

  useEffect(() => {
    if (!open || !invoice) return
    const previousEntry = latestDeliveryLogEntry(invoice.deliveryLog)
    const priorMap = new Map((previousEntry?.lines ?? []).map((l) => [l.lineId, l.deliveredQuantity ?? 0]))
    setPriorByLine(priorMap)
    setLines(
      defaultLogLinesForStatus(invoice, nextDeliveryStatus, previousEntry).map(syncPending),
    )
    setNote('')
  }, [open, invoice, nextDeliveryStatus])

  if (!invoice) return null

  const previous = normalizeDeliveryStatus(previousDeliveryStatus)
  const next = normalizeDeliveryStatus(nextDeliveryStatus)
  const isProgressUpdate = progressUpdate || (previous === next && next === 'partial_delivery')
  const priorSnapshotLines = latestDeliveryLogEntry(invoice.deliveryLog)?.lines

  function handleDeliveredChange(lineId, value) {
    setLines((prev) =>
      prev.map((line) =>
        line.lineId === lineId ? syncPending({ ...line, deliveredQuantity: value }) : line,
      ),
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    const entry = createDeliveryLogEntry({
      previousDeliveryStatus: previous,
      lines,
      note,
      priorSnapshotLines,
      progressUpdate: isProgressUpdate,
    })
    onConfirm?.(entry)
  }

  return (
    <Modal
      open={open}
      title="Record delivery"
      onClose={onClose}
      panelClassName="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isProgressUpdate ? (
            <>
              Still{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {deliveryStatusLabel(next)}
              </span>
              . Enter <strong>total delivered so far</strong> per product (adds to your delivery
              log; invoice PDF unchanged).
            </>
          ) : (
            <>
              This note is for your records only — invoice line items and PDF stay unchanged. Status:{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {deliveryStatusLabel(previous)}
              </span>{' '}
              →{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {deliveryStatusLabel(next)}
              </span>
            </>
          )}
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Ordered</th>
                {isProgressUpdate && priorByLine.size > 0 ? (
                  <th className="px-3 py-2 text-right">Was del.</th>
                ) : null}
                <th className="px-3 py-2 text-right">Total delivered</th>
                <th className="px-3 py-2 text-right">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lines.map((line) => {
                const wasDelivered = priorByLine.get(line.lineId) ?? 0
                const added = line.deliveredQuantity - wasDelivered
                return (
                  <tr key={line.lineId}>
                    <td className="px-3 py-2 font-medium">{line.productName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{line.orderedQuantity}</td>
                    {isProgressUpdate && priorByLine.size > 0 ? (
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                        {wasDelivered}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={wasDelivered}
                        max={line.orderedQuantity}
                        step="1"
                        className={`${inputClass} w-20 py-1 text-right`}
                        value={line.deliveredQuantity}
                        onChange={(e) => handleDeliveredChange(line.lineId, e.target.value)}
                        aria-label={`Total delivered for ${line.productName}`}
                      />
                      {isProgressUpdate && priorByLine.size > 0 && added > 0 ? (
                        <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                          +{added} this update
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">
                      {line.pendingQuantity}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <label className="block">
          <span className="field-label">Note (optional)</span>
          <textarea
            className={`${inputClass} mt-1 min-h-[72px]`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. partial shipment, driver name, follow-up date…"
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save delivery log
          </button>
        </div>
      </form>
    </Modal>
  )
}
