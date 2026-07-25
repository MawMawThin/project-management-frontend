import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { clearAuth, getStoredUser, saveAuth, type AuthUser } from './authStorage'
import { authApi } from '../api/services'

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(username, password) {
        const res = await authApi.login(username, password)
        const next: AuthUser = {
          id: res.id,
          name: res.name,
          username: res.username,
          role: res.role,
          token: res.token,
        }
        saveAuth(next)
        setUser(next)
      },
      logout() {
        clearAuth()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
