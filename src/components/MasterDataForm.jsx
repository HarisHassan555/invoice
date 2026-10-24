export default function MasterDataForm({
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
  cancelLabel = 'Cancel',
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
            <span className="field-label">{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea
                className="field-input"
                rows={3}
                value={values[field.name] ?? ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                required={field.required}
              />
            ) : (
              <input
                type={field.type ?? 'text'}
                className="field-input"
                value={values[field.name] ?? ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                required={field.required}
                step={field.step}
                min={field.min}
              />
            )}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
        ) : null}
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export const inputClass = 'field-input'
