import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/invoices'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-secondary text-xs capitalize"
        >
          {theme}
        </button>
      </div>

      <div className="panel w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Invoice Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to continue</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            setSubmitting(true)
            const ok = login(username, password)
            setSubmitting(false)
            if (!ok) {
              setError('Invalid username or password.')
              return
            }
            navigate(from, { replace: true })
          }}
        >
          <label className="block">
            <span className="field-label">Username</span>
            <input
              type="text"
              className="field-input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="field-label">Password</span>
            <input
              type="password"
              className="field-input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
