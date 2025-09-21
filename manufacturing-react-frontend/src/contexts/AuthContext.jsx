import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Minimal JWT parsing helper (no crypto) to read payload
function parseJwt(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

function isTokenExpired(token) {
  const p = parseJwt(token)
  if (!p) return true
  if (!p.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return p.exp <= now + 5
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Bootstrap: if access token exists and not expired, set Authorization and user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const access = localStorage.getItem('access')
        if (access && !isTokenExpired(access)) {
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`
          const payload = parseJwt(access)
          const loginId = payload?.username || payload?.email || payload?.sub || null
          if (mounted && loginId) {
            const u = { loginId }
            setUser(u)
            try { localStorage.setItem('user', JSON.stringify(u)) } catch (e) {}
          }
        } else {
          // no valid access token
          setUser(null)
          try { localStorage.removeItem('access') } catch(e) {}
          try { localStorage.removeItem('refresh') } catch(e) {}
          try { localStorage.removeItem('user') } catch(e) {}
          try { delete api.defaults.headers.common['Authorization'] } catch(e) {}
        }
      } finally {
        if (mounted) setAuthLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const loginWithTokens = ({ access, refresh }) => {
    try { localStorage.setItem('access', access) } catch (e) {}
    try { localStorage.setItem('refresh', refresh) } catch (e) {}
    try { api.defaults.headers.common['Authorization'] = `Bearer ${access}` } catch (e) {}
    const payload = parseJwt(access)
    const loginId = payload?.username || payload?.email || payload?.sub || null
    if (loginId) {
      const u = { loginId }
      setUser(u)
      try { localStorage.setItem('user', JSON.stringify(u)) } catch (e) {}
    }
  }

  const reloadUser = async () => {
    // With token-based flow we can derive user from the access token
    const access = localStorage.getItem('access')
    if (access && !isTokenExpired(access)) {
      const payload = parseJwt(access)
      const loginId = payload?.username || payload?.email || payload?.sub || null
      if (loginId) {
        const u = { loginId }
        setUser(u)
        try { localStorage.setItem('user', JSON.stringify(u)) } catch (e) {}
        return u
      }
    }
    setUser(null)
    return null
  }

  const logout = async () => {
    try {
      // notify backend to invalidate tokens if endpoint exists
      await api.post('/account/logout/', {}, { withCredentials: false })
    } catch (e) {
      // ignore server errors
    }
    setUser(null)
    try { localStorage.removeItem('user') } catch (e) {}
    try { localStorage.removeItem('access') } catch (e) {}
    try { localStorage.removeItem('refresh') } catch (e) {}
    try { delete api.defaults.headers.common['Authorization'] } catch (e) {}
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, loginWithTokens, reloadUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
