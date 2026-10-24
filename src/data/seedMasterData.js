import { nanoid } from '@reduxjs/toolkit'
import { sampleCustomers, sampleProducts } from './sampleMasterData'
import { setCustomerItems } from '../store/slices/customersSlice'
import { setProductItems } from '../store/slices/productsSlice'

function withIds(rows) {
  return rows.map((row) => ({ id: nanoid(), ...row }))
}

/** Adds sample customers/products when those lists are empty. Returns true if anything was seeded. */
export function seedMasterDataIfEmpty(store) {
  const state = store.getState()
  let changed = false

  if (state.customers.items.length === 0) {
    store.dispatch(setCustomerItems(withIds(sampleCustomers)))
    changed = true
  }

  if (state.products.items.length === 0) {
    store.dispatch(setProductItems(withIds(sampleProducts)))
    changed = true
  }

  return changed
}
