import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState(localStorage.getItem('sc_token'));

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else       delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await axios.get('/api/auth/me');
        if (data.success) setUser(data.user); else logout();
      } catch { logout(); }
      finally { setLoading(false); }
    };
    verify();
  }, []);

  const _saveToken = (t, u) => {
    localStorage.setItem('sc_token', t);
    setToken(t);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setUser(u);
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    if (data.success) _saveToken(data.token, data.user);
    return data;
  };

  const register = async (form) => {
    const { data } = await axios.post('/api/auth/register', form);
    if (data.success) _saveToken(data.token, data.user);
    return data;
  };

  const logout = async () => {
    try { await axios.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('sc_token');
    setToken(null); setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (form) => {
    const { data } = await axios.put('/api/auth/profile', form);
    if (data.success) setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
