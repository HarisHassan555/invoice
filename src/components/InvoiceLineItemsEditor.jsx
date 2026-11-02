import { inputClass } from './MasterDataForm'
import { productToLine } from '../utils/invoiceLines'
import { formatMoney, lineTotal } from '../utils/invoiceMath'
import { clampDeliveredQuantity, pendingQuantity } from '../utils/invoiceStatus'

export const CREATE_PRODUCT_OPTION = '__create_product__'

export default function InvoiceLineItemsEditor({
  products,
  lines,
  onChange,
  disabled,
  showDelivery = false,
  onRequestCreateProduct,
}) {
  const setLines = onChange

  const addProductLine = (productId) => {
    if (!productId) return
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setLines((prev) => [...prev, productToLine(product)])
  }

  const updateLine = (lineId, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.lineId !== lineId) return l
        if (field === 'quantity') {
          const quantity = Math.max(1, Number(value) || 0)
          return {
            ...l,
            quantity,
            deliveredQuantity: clampDeliveredQuantity(l.deliveredQuantity, quantity),
          }
        }
        if (field === 'deliveredQuantity') {
          return {
            ...l,
            deliveredQuantity: clampDeliveredQuantity(value, l.quantity),
          }
        }
        if (field === 'unitPrice') {
          return { ...l, unitPrice: Number(value) || 0 }
        }
        return { ...l, [field]: Number(value) || 0 }
      }),
    )
  }

  const changeLineProduct = (lineId, productId) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setLines((prev) =>
      prev.map((l) => {
        if (l.lineId !== lineId) return l
        return productToLine(product, l.quantity, lineId, l.deliveredQuantity)
      }),
    )
  }

  const removeLine = (lineId) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }

  const missingProducts = !products.length && !onRequestCreateProduct

  return (
    <div className="panel p-6">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1">
          <span className="field-label">Add product</span>
          <select
            className={inputClass}
            defaultValue=""
            disabled={disabled || (missingProducts && !onRequestCreateProduct)}
            onChange={(e) => {
              const value = e.target.value
              if (value === CREATE_PRODUCT_OPTION) {
                onRequestCreateProduct?.()
                e.target.value = ''
                return
              }
              addProductLine(value)
              e.target.value = ''
            }}
          >
            <option value="">Choose product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(Number(p.price))}
              </option>
            ))}
            {onRequestCreateProduct ? (
              <option value={CREATE_PRODUCT_OPTION}>+ Create new product…</option>
            ) : null}
          </select>
        </label>
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No line items yet. Add a product from the list
          {onRequestCreateProduct ? ' or create a new one' : ''}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="pb-2 pr-3">Product</th>
                <th className="pb-2 pr-4">Qty</th>
                {showDelivery ? (
                  <>
                    <th className="pb-2 pr-4">Delivered</th>
                    <th className="pb-2 pr-4">Pending</th>
                  </>
                ) : null}
                <th className="pb-2 pr-4">Unit price</th>
                <th className="pb-2 pr-4">Line total</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lines.map((line) => (
                <tr key={line.lineId ?? line.productId}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      {line.imageDataUrl ? (
                        <img
                          src={line.imageDataUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded border border-slate-200 object-cover dark:border-slate-600"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400 dark:border-slate-600">
                          —
                        </div>
                      )}
                      <select
                        className="field-input min-w-[140px] flex-1 py-1"
                        value={line.productId}
                        onChange={(e) => changeLineProduct(line.lineId, e.target.value)}
                        disabled={disabled}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="field-input w-20 py-1"
                      value={line.quantity}
                      disabled={disabled}
                      onChange={(e) => updateLine(line.lineId, 'quantity', e.target.value)}
                    />
                  </td>
                  {showDelivery ? (
                    <>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min="0"
                          max={line.quantity}
                          step="1"
                          className="field-input w-20 py-1"
                          value={line.deliveredQuantity ?? 0}
                          disabled={disabled}
                          onChange={(e) =>
                            updateLine(line.lineId, 'deliveredQuantity', e.target.value)
                          }
                        />
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                        {pendingQuantity(line)}
                      </td>
                    </>
                  ) : null}
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="field-input w-28 py-1"
                      value={line.unitPrice}
                      disabled={disabled}
                      onChange={(e) => updateLine(line.lineId, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td className="py-3 pr-4">{formatMoney(lineTotal(line))}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeLine(line.lineId)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
