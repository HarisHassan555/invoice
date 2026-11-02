import ImageUploadField from './ImageUploadField'
import { inputClass } from './MasterDataForm'

export const emptyProductForm = { name: '', description: '', price: '', imageDataUrl: '' }

export default function ProductFormFields({ values, onChange, idPrefix = 'product' }) {
  const set = (patch) => onChange((v) => ({ ...v, ...patch }))

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="field-label">Product name</span>
        <input
          id={`${idPrefix}-name`}
          className={inputClass}
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          required
        />
      </label>
      <label className="sm:col-span-2">
        <span className="field-label">Description</span>
        <textarea
          className={inputClass}
          rows={2}
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
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
          onChange={(e) => set({ price: e.target.value })}
          required
        />
      </label>
      <ImageUploadField
        label="Product image"
        hint="Shown on invoice line items next to the product name."
        value={values.imageDataUrl}
        onChange={(v) => set({ imageDataUrl: v })}
      />
    </div>
  )
}
