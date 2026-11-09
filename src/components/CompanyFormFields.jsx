import { inputClass } from './MasterDataForm'
import ImageUploadField from './ImageUploadField'
import { companyPhonesForForm, emptyCompany } from '../utils/companyFields'
import { INVOICE_ENQUIRY_FOOTER } from '../utils/invoiceDocumentCopy'

const textFields = [
  { name: 'name', label: 'Company name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'website', label: 'Website' },
  { name: 'taxId', label: 'Tax / registration ID' },
  { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
]

const bankFields = [
  { name: 'bankName', label: 'Bank name' },
  { name: 'accountHolder', label: 'Account name' },
  { name: 'accountNumber', label: 'Account no.' },
]

export default function CompanyFormFields({
  values,
  onChange,
  showBranding = true,
  showInvoiceTextDefaults = false,
}) {
  const set = (name, val) => onChange({ ...values, [name]: val })
  const phones = companyPhonesForForm(values)

  function setPhones(nextPhones) {
    onChange({ ...values, phones: nextPhones })
  }

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
        <span className="field-label">Phone numbers</span>
        <ul className="mt-1 space-y-2">
          {phones.map((phone, index) => (
            <li key={index} className="flex gap-2">
              <input
                type="tel"
                className={`${inputClass} flex-1`}
                value={phone}
                placeholder={index === 0 ? 'Primary number' : 'Additional number'}
                onChange={(e) => {
                  const next = [...phones]
                  next[index] = e.target.value
                  setPhones(next)
                }}
              />
              <button
                type="button"
                className="btn-secondary shrink-0 px-3 py-1.5 text-xs disabled:opacity-40"
                disabled={phones.length <= 1}
                onClick={() => setPhones(phones.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 text-sm font-medium text-slate-700 underline dark:text-slate-300"
          onClick={() => setPhones([...phones, ''])}
        >
          Add another number
        </button>
      </div>

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

      {showInvoiceTextDefaults ? (
        <>
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Invoice text (PDF footer &amp; defaults)
            </p>
          </div>
          <label className="sm:col-span-2">
            <span className="field-label">Enquiry footer</span>
            <textarea
              className={inputClass}
              rows={3}
              value={values.enquiryFooter ?? ''}
              onChange={(e) => set('enquiryFooter', e.target.value)}
              placeholder={INVOICE_ENQUIRY_FOOTER}
            />
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Shown at the bottom of every invoice PDF for this company.
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Default invoice notes / terms</span>
            <textarea
              className={inputClass}
              rows={3}
              value={values.defaultInvoiceNotes ?? ''}
              onChange={(e) => set('defaultInvoiceNotes', e.target.value)}
              placeholder="Payment terms, thank-you message, etc."
            />
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Prefills the notes field when you create a new invoice with this company (you can still
              edit it per invoice).
            </span>
          </label>
        </>
      ) : null}

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
