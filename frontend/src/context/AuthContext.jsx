import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,   setUser]   = useState(() => JSON.parse(localStorage.getItem('gg_user')   || 'null'))
  const [school, setSchool] = useState(() => JSON.parse(localStorage.getItem('gg_school') || 'null'))
  const [token,  setToken]  = useState(() => localStorage.getItem('gg_token') || null)

  const login = (data) => {
    localStorage.setItem('gg_token',  data.token)
    localStorage.setItem('gg_user',   JSON.stringify(data.user))
    localStorage.setItem('gg_school', JSON.stringify(data.school))
    setToken(data.token)
    setUser(data.user)
    setSchool(data.school)
  }

  const logout = () => {
    localStorage.removeItem('gg_token')
    localStorage.removeItem('gg_user')
    localStorage.removeItem('gg_school')
    setToken(null); setUser(null); setSchool(null)
  }

  const updateSchool = (s) => {
    localStorage.setItem('gg_school', JSON.stringify(s))
    setSchool(s)
  }

  return (
    <AuthContext.Provider value={{ user, school, token, login, logout, updateSchool }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
