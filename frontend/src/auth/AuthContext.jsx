import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || 'https://fsd-project-81bb.onrender.com';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

axios.defaults.withCredentials = true;

// Attach token from localStorage to every request (fallback when cookies don't work cross-origin)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
        setInitializing(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/auth/me`);
        if (res.data && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        } else {
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } catch {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setInitializing(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    if (!res.data || !res.data.user) throw new Error('Invalid response from server');
    const { user: userData, token } = res.data;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
    setUser(userData);
    return userData;
  };

  const signup = async (payload) => {
    const res = await axios.post(`${API_BASE}/auth/signup`, payload);
    if (!res.data || !res.data.user) throw new Error('Invalid response from server');
    const { user: userData, token } = res.data;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

