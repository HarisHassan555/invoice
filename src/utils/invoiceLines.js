import { nanoid } from '@reduxjs/toolkit'
import { clampDeliveredQuantity } from './invoiceStatus'

export function productToLine(product, quantity = 1, lineId, deliveredQuantity = 0) {
  const qty = Number(quantity) || 1
  return {
    lineId: lineId ?? nanoid(),
    productId: product.id,
    productName: product.name,
    imageDataUrl: product.imageDataUrl ?? '',
    quantity: qty,
    unitPrice: Number(product.price) || 0,
    deliveredQuantity: clampDeliveredQuantity(deliveredQuantity, qty),
  }
}

export function normalizeLineItems(items) {
  return (items ?? []).map((line) => {
    const quantity = Number(line.quantity) || 0
    return {
      ...line,
      lineId: line.lineId ?? nanoid(),
      imageDataUrl: line.imageDataUrl ?? '',
      quantity,
      deliveredQuantity: clampDeliveredQuantity(line.deliveredQuantity, quantity),
    }
  })
}
