import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_LINKS || 'http://127.0.0.1:8003',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);
  const [companyid,setCompanyid] = useState(null)

  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      verifyAndSetUser(token);
    } else {
      setLoading(false);
    }
    return () => clearInterval(refreshTimer.current);
  }, []);

  const verifyAndSetUser = async (token) => {
    try {
      const res = await api.get('/api/v1/verify-token', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.data) {
        setUser(res.data.data);
        setCompanyid(res.data.data.companyId)
        setPermissions(res.data.data.permissions || {});
        scheduleRefresh();
      }

    } catch {
      deleteCookie('token');
    } finally {
      setLoading(false);
    }
  };

  const scheduleRefresh = () => {
    clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(async () => {
      try {
        const res = await api.post('/api/v1/refresh-token', {});
        if (res.data?.access_token) {
          setCookie('token', res.data.access_token);
        }
      } catch {
        clearInterval(refreshTimer.current);
        logout();
      }
    }, 25 * 60 * 1000);
  };

  const setAuthUser = (userData, token) => {
    if (token) setCookie('token', token);
    setUser(userData);
    setPermissions(userData?.permissions || {});
    scheduleRefresh();
    setLoading(false);
  };

  const logout = () => {
    clearInterval(refreshTimer.current);
    deleteCookie('token');
    setUser(null);
    setPermissions({});
  };

  const hasPermission = (module, action = 'Read') =>
    permissions?.[module]?.[action] === true;

  const hasRole = (role) =>
    user?.role === role || (Array.isArray(role) && role.includes(user?.role));

  const isSuperAdmin = () => user?.role === 'super_admin';

  const value = {
    user,
    permissions,
    loading,
    isAuthenticated: !!user,
    setAuthUser,
    logout,
    hasPermission,
    hasRole,
    isSuperAdmin,
    companyid
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export default AuthContext;
