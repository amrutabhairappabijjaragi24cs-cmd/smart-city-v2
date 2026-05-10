import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('sc_token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');

        if (data.success) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  const saveToken = (t, u) => {
    localStorage.setItem('sc_token', t);
    setToken(t);

    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;

    setUser(u);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    });

    if (data.success) {
      saveToken(data.token, data.user);
    }

    return data;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);

    if (data.success) {
      saveToken(data.token, data.user);
    }

    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {}

    localStorage.removeItem('sc_token');

    setToken(null);
    setUser(null);

    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (form) => {
    const { data } = await api.put('/auth/profile', form);

    if (data.success) {
      setUser(data.user);
    }

    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);