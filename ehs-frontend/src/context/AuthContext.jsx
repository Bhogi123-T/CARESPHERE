import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in (token exists)
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (contact_info, password) => {
    try {
      const response = await api.post('/auth/login', { contact_info, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Route based on role
      if (user.role === 'patient') navigate('/patient/dashboard');
      else if (user.role === 'hospital') navigate('/hospital/dashboard');
      else if (user.role === 'ambulance') navigate('/ambulance/dashboard');
      else if (user.role === 'volunteer') navigate('/volunteer/dashboard');
      else if (user.role === 'pharmacy') navigate('/pharmacy/dashboard');
      else if (user.role === 'blood_donor') navigate('/blood_donor/dashboard');
      else if (user.role === 'government') navigate('/government/dashboard');
      else navigate('/');
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (contact_info, password, role) => {
    try {
      await api.post('/auth/register', { contact_info, password, role });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
