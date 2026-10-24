import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DataTable from '../components/DataTable'
import ImageUploadField from '../components/ImageUploadField'
import { inputClass } from '../components/MasterDataForm'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { addProduct, removeProduct, updateProduct } from '../store/slices/productsSlice'
import { formatMoney } from '../utils/invoiceMath'

const empty = { name: '', description: '', price: '', imageDataUrl: '' }

export default function MasterProductPage() {
  const dispatch = useDispatch()
  const items = useSelector((s) => s.products.items)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [values, setValues] = useState(empty)

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setValues(empty)
  }

  const openCreate = () => {
    setEditingId(null)
    setValues(empty)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setValues({
      name: row.name ?? '',
      description: row.description ?? '',
      price: row.price ?? '',
      imageDataUrl: row.imageDataUrl ?? '',
    })
    setModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Product"
        description="Catalog items with images, descriptions, and default prices for invoices."
        action={
          <button type="button" onClick={openCreate} className="btn-primary">
            Add product
          </button>
        }
      />
      <DataTable
        emptyMessage="No products yet. Click Add product to create one."
        rows={items}
        columns={[
          {
            key: 'image',
            label: '',
            render: (row) =>
              row.imageDataUrl ? (
                <img
                  src={row.imageDataUrl}
                  alt=""
                  className="h-9 w-9 rounded border border-slate-200 object-cover dark:border-slate-600"
                />
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          { key: 'name', label: 'Name' },
          {
            key: 'price',
            label: 'Price',
            render: (row) => formatMoney(Number(row.price)),
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(removeProduct(row.id))}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} title={editingId ? 'Edit product' : 'Add product'} onClose={closeModal}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const payload = {
              ...values,
              price: parseFloat(values.price) || 0,
            }
            if (editingId) {
              dispatch(updateProduct({ id: editingId, ...payload }))
            } else {
              dispatch(addProduct(payload))
            }
            closeModal()
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="field-label">Product name</span>
              <input
                className={inputClass}
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                required
              />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Description</span>
              <textarea
                className={inputClass}
                rows={2}
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              />
            </label>
            <label>
              <span className="field-label">Default price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={values.price}
                onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
                required
              />
            </label>
            <ImageUploadField
              label="Product image"
              hint="Shown on invoice line items next to the product name."
              value={values.imageDataUrl}
              onChange={(v) => setValues((prev) => ({ ...prev, imageDataUrl: v }))}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!values.name?.trim()}>
              Save product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
