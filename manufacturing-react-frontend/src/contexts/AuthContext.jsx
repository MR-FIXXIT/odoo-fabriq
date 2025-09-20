import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // store registered users

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

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
