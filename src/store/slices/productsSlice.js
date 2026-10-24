import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProduct: {
      reducer(state, action) {
        state.items.push(action.payload)
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } }
      },
    },
    updateProduct(state, action) {
      const idx = state.items.findIndex((p) => p.id === action.payload.id)
      if (idx !== -1) state.items[idx] = action.payload
    },
    removeProduct(state, action) {
      state.items = state.items.filter((p) => p.id !== action.payload)
    },
    setProductItems(state, action) {
      state.items = action.payload
    },
  },
})

export const { addProduct, updateProduct, removeProduct, setProductItems } = productsSlice.actions
export default productsSlice.reducer
