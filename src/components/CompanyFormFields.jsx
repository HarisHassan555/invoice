import { inputClass } from './MasterDataForm'
import ImageUploadField from './ImageUploadField'

const textFields = [
  { name: 'name', label: 'Company name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'website', label: 'Website' },
  { name: 'taxId', label: 'Tax / registration ID' },
  { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
]

const bankFields = [
  { name: 'bankName', label: 'Bank name' },
  { name: 'accountHolder', label: 'Account name' },
  { name: 'accountNumber', label: 'Account no.' },
]

export default function CompanyFormFields({ values, onChange, showBranding = true }) {
  const set = (name, val) => onChange({ ...values, [name]: val })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {textFields.map((field) => (
        <label key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
          <span className="field-label">{field.label}</span>
          {field.type === 'textarea' ? (
            <textarea
              className={inputClass}
              rows={2}
              value={values[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
              required={field.required}
            />
          ) : (
            <input
              type={field.type ?? 'text'}
              className={inputClass}
              value={values[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
              required={field.required}
            />
          )}
        </label>
      ))}

      <div className="sm:col-span-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Bank details (shown on invoice)
        </p>
      </div>

      {bankFields.map((field) => (
        <label key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
          <span className="field-label">{field.label}</span>
          {field.type === 'textarea' ? (
            <textarea
              className={inputClass}
              rows={2}
              value={values[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className={inputClass}
              value={values[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
            />
          )}
        </label>
      ))}

      {showBranding ? (
        <>
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Branding
            </p>
          </div>
          <ImageUploadField
            label="Company logo"
            hint="Displayed top-right on the invoice PDF."
            value={values.logoDataUrl ?? ''}
            onChange={(v) => set('logoDataUrl', v)}
          />
          <ImageUploadField
            label="Authorized signature"
            hint="Shown at the bottom of the invoice."
            value={values.signatureDataUrl ?? ''}
            onChange={(v) => set('signatureDataUrl', v)}
          />
        </>
      ) : null}
    </div>
  )
}
