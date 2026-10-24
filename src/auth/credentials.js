export const SEEDED_USERNAME = 'nouman'
export const SEEDED_PASSWORD = 'pass123'

export const AUTH_STORAGE_KEY = 'invoice_app_auth'

export function credentialsMatch(username, password) {
  const u = String(username ?? '').trim().toLowerCase()
  const p = String(password ?? '')
  return u === SEEDED_USERNAME.toLowerCase() && p === SEEDED_PASSWORD
}
