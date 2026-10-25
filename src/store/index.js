import { configureStore } from '@reduxjs/toolkit'
import companiesReducer from './slices/companiesSlice'
import customersReducer from './slices/customersSlice'
import productsReducer from './slices/productsSlice'
import invoicesReducer from './slices/invoicesSlice'

export const store = configureStore({
  reducer: {
    companies: companiesReducer,
    customers: customersReducer,
    products: productsReducer,
    invoices: invoicesReducer,
  },
})
