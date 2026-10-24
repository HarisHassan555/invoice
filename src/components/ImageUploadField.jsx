import { useId, useState } from 'react'
import { readImageAsDataUrl } from '../utils/imageUpload'

export default function ImageUploadField({ label, hint, value, onChange }) {
  const id = useId()
  const [error, setError] = useState(null)

  return (
    <div className="sm:col-span-2">
      <span className="field-label">{label}</span>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-16 max-w-[140px] rounded border border-slate-200 object-contain dark:border-slate-600"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="btn-secondary inline-flex cursor-pointer px-3 py-1.5 text-xs"
          >
            {value ? 'Replace' : 'Upload'}
          </label>
          {value ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                setError(null)
                onChange('')
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              setError(null)
              const dataUrl = await readImageAsDataUrl(file)
              onChange(dataUrl)
            } catch (err) {
              setError(err.message ?? 'Upload failed')
            }
          }}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  )
}
