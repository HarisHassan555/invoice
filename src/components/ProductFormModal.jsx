import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Modal from './Modal'
import ProductFormFields, { emptyProductForm } from './ProductFormFields'
import { addProduct } from '../store/slices/productsSlice'

export default function ProductFormModal({ open, onClose, onCreated }) {
  const dispatch = useDispatch()
  const [values, setValues] = useState(emptyProductForm)

  useEffect(() => {
    if (open) setValues(emptyProductForm)
  }, [open])

  return (
    <Modal open={open} title="Create product" onClose={onClose} panelClassName="max-w-lg">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!values.name?.trim()) return
          const action = addProduct({
            name: values.name.trim(),
            description: values.description?.trim() ?? '',
            price: parseFloat(values.price) || 0,
            imageDataUrl: values.imageDataUrl ?? '',
          })
          const product = action.payload
          dispatch(action)
          onCreated?.(product)
          onClose()
        }}
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Saved to your product catalog and added to this invoice.
        </p>
        <ProductFormFields values={values} onChange={setValues} idPrefix="inline-product" />
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!values.name?.trim()}>
            Save &amp; add to invoice
          </button>
        </div>
      </form>
    </Modal>
  )
}
