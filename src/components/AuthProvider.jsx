import { createContext, useContext, useState } from 'react'
import { getStoredAuth, clearAuth } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = getStoredAuth()
    return {
      isLoggedIn: !!stored.token && !!stored.user,
      user: stored.user,
      token: stored.token,
    }
  })

  function onLogin(token, user) {
    setAuth({ isLoggedIn: true, user, token })
  }

  function onLogout() {
    clearAuth()
    setAuth({ isLoggedIn: false, user: null, token: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, onLogin, onLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
