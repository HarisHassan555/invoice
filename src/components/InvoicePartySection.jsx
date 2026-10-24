import CompanyFormFields from './CompanyFormFields'
import { inputClass } from './MasterDataForm'

const customerFields = [
  { name: 'name', label: 'Customer name', required: true, fullWidth: false },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
]

export default function InvoicePartySection({
  title,
  mode,
  onModeChange,
  selectedId,
  onSelectId,
  options,
  manualValues,
  onManualChange,
  variant,
}) {
  const selectPlaceholder = variant === 'company' ? 'Select company…' : 'Select customer…'

  return (
    <div className="panel flex flex-col gap-4 p-5 lg:col-span-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="field-label">{title}</span>
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-600">
          <button
            type="button"
            onClick={() => onModeChange('select')}
            className={[
              'rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'select'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
            ].join(' ')}
          >
            From list
          </button>
          <button
            type="button"
            onClick={() => onModeChange('manual')}
            className={[
              'rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'manual'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
            ].join(' ')}
          >
            Manual
          </button>
        </div>
      </div>

      {mode === 'select' ? (
        <label>
          <span className="sr-only">{title}</span>
          <select
            className={inputClass}
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value
              onSelectId(id)
              if (id) {
                const row = options.find((o) => o.id === id)
                if (row) onManualChange(row)
              }
            }}
          >
            <option value="">{selectPlaceholder}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {options.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              No saved {variant === 'company' ? 'companies' : 'customers'}. Use Manual or add master
              data.
            </p>
          ) : null}
        </label>
      ) : variant === 'company' ? (
        <CompanyFormFields values={manualValues} onChange={onManualChange} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {customerFields.map((field) => (
            <label key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
              <span className="field-label">{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea
                  className={inputClass}
                  rows={2}
                  value={manualValues[field.name] ?? ''}
                  onChange={(e) => onManualChange({ ...manualValues, [field.name]: e.target.value })}
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type ?? 'text'}
                  className={inputClass}
                  value={manualValues[field.name] ?? ''}
                  onChange={(e) => onManualChange({ ...manualValues, [field.name]: e.target.value })}
                  required={field.required}
                />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
