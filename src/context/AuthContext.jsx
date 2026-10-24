import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEY, credentialsMatch } from '../auth/credentials'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.username ? { username: parsed.username } : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback((username, password) => {
    if (!credentialsMatch(username, password)) return false
    const next = { username: username.trim() }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
    setUser(next)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.username),
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
