import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer: {
      reducer(state, action) {
        state.items.push(action.payload)
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } }
      },
    },
    updateCustomer(state, action) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) state.items[idx] = action.payload
    },
    removeCustomer(state, action) {
      state.items = state.items.filter((c) => c.id !== action.payload)
    },
    setCustomerItems(state, action) {
      state.items = action.payload
    },
  },
})

export const { addCustomer, updateCustomer, removeCustomer, setCustomerItems } =
  customersSlice.actions
export default customersSlice.reducer
