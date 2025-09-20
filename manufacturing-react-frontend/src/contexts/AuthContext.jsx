import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

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
  const [users, setUsers] = useState([]); // store registered users (legacy local auth)

  // Bootstrap current user from cookies on app load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer the actual endpoint from your backend: /account/users/
        const endpoints = ['/account/users/', '/account/load-user/', '/account/user/'];
        let res = null;
        for (const ep of endpoints) {
          try {
            const r = await api.get(ep);
            if (r && r.status === 200) { res = r; break; }
          } catch (e) {
            // continue to next endpoint
          }
        }
        if (!res) throw new Error('No load-user endpoint matched');

        const data = res?.data || {};
        const loginId = data.loginid || data.loginId || data.username || data.email || null;
        if (mounted && loginId) {
          const u = { loginId };
          setUser(u);
          try { localStorage.setItem('user', JSON.stringify(u)); } catch {}
        }
      } catch (e) {
        if (mounted) {
          setUser(null);
          try { localStorage.removeItem('user'); } catch {}
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const signup = (loginId, email, password) => {
    // Check if loginId or email already exists
    if (users.some(u => u.loginId === loginId)) {
      return { success: false, message: "Login ID already exists" };
    }
    if (users.some(u => u.email === email)) {
      return { success: false, message: "Email already exists" };
    }

    // Add new user
    setUsers([...users, { loginId, email, password }]);
    return { success: true };
  };

  const login = (loginId, password) => {
    const existingUser = users.find(u => u.loginId === loginId && u.password === password);
    if (existingUser) {
      setUser({ loginId: existingUser.loginId });
      return { success: true };
    }
    return { success: false, message: "Invalid credentials" };
  };

  const loginRemote = (loginId) => {
    const u = { loginId };
    setUser(u);
    try { localStorage.setItem('user', JSON.stringify(u)); } catch {}
    return { success: true };
  };

  const logout = async () => {
    try {
      await api.post('/account/logout/');
    } catch (e) {
      // swallow, still clear client state
    }
    setUser(null);
    try { localStorage.removeItem('user'); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, loginRemote, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
