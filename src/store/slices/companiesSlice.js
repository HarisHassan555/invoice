import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
}

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    addCompany: {
      reducer(state, action) {
        state.items.push(action.payload)
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } }
      },
    },
    updateCompany(state, action) {
      const idx = state.items.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) state.items[idx] = action.payload
    },
    removeCompany(state, action) {
      state.items = state.items.filter((c) => c.id !== action.payload)
    },
    setCompanyItems(state, action) {
      state.items = action.payload
    },
  },
})

export const { addCompany, updateCompany, removeCompany, setCompanyItems } = companiesSlice.actions
export default companiesSlice.reducer
