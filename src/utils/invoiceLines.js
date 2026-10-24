import { nanoid } from '@reduxjs/toolkit'

export function productToLine(product, quantity = 1, lineId) {
  return {
    lineId: lineId ?? nanoid(),
    productId: product.id,
    productName: product.name,
    imageDataUrl: product.imageDataUrl ?? '',
    quantity,
    unitPrice: Number(product.price) || 0,
  }
}

export function normalizeLineItems(items) {
  return (items ?? []).map((line) => ({
    ...line,
    lineId: line.lineId ?? nanoid(),
    imageDataUrl: line.imageDataUrl ?? '',
  }))
}
