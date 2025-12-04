import React, { createContext, useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ai_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ai_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem('ai_token', token); else localStorage.removeItem('ai_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('ai_user', JSON.stringify(user)); else localStorage.removeItem('ai_user');
  }, [user]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.me(token);
      if (res && res.user) setUser(res.user);
    } catch (e) {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    const tokenVal = res.token ?? res.data?.token;
    const userVal = res.user ?? res.data?.user ?? null;
    setToken(tokenVal);
    if (userVal) setUser(userVal);
    return { token: tokenVal, user: userVal };
  };

  const register = async (name, email, password) => {
    return await api.register(name, email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ai_token');
    localStorage.removeItem('ai_user');
  };

  // NEW: updateRole: optimistic update + backend call
  const updateRole = async (newRole) => {
    // Update UI optimistically
    const prevUser = user;
    setUser(prev => prev ? { ...prev, role: newRole } : prev);

    try {
      if (!token) throw new Error('Not authenticated');
      // send to backend (expects /user/role PATCH)
      const res = await api.updateUserRole(newRole, token);
      // backend may return updated user; if so sync it
      if (res && (res.user || res.updatedUser)) {
        setUser(res.user ?? res.updatedUser);
      }
      return { success: true, data: res };
    } catch (err) {
      // rollback UI change on error
      setUser(prevUser);
      return { success: false, error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, refresh, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}
