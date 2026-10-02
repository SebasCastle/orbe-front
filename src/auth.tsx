import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthResponse, AuthUser } from './types'

type AuthValue = {
  user: AuthUser | null
  ready: boolean
  setSession: (session: AuthResponse) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('orbe.user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUser)

  useEffect(() => {
    const sync = () => setUser(readUser())
    window.addEventListener('orbe-auth', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('orbe-auth', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready: true,
      setSession(session) {
        localStorage.setItem('orbe.token', session.token)
        localStorage.setItem('orbe.user', JSON.stringify(session.user))
        setUser(session.user)
      },
      async logout() {
        const token = localStorage.getItem('orbe.token')
        localStorage.removeItem('orbe.token')
        localStorage.removeItem('orbe.user')
        localStorage.removeItem('orbe.spotifyUserId')
        setUser(null)
        if (token) {
          await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined)
        }
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('La sesión no está disponible.')
  return context
}
