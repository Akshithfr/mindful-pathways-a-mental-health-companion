import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = 'http://localhost:5000/api'; // Update this to your backend URL

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptors
  useEffect(() => {
    axios.defaults.headers.common['x-auth-token'] = token ? token : '';
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setCurrentUser(res.data);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password: '****' });
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      console.log('Login response:', res.data);
      
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
      
      // Fallback to localStorage during transition
      try {
        console.log('Attempting localStorage fallback login');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          console.log('localStorage login successful');
          setCurrentUser(user);
          return user;
        } else {
          console.log('User not found in localStorage');
        }
      } catch (localError) {
        console.error('Local storage fallback failed:', localError);
      }
      
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      // Try API registration first
      await axios.post(`${API_URL}/auth/register`, { name, email, password });
      return true;
    } catch (error) {
      console.error('API registration failed, trying localStorage fallback:', error);
      
      // Fallback to localStorage
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.some(user => user.email === email)) {
          throw new Error('Email already in use');
        }
        
        // Add new user
        const newUser = { id: Date.now().toString(), name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        return true;
      } catch (localError) {
        console.error('Local storage fallback failed:', localError);
        throw localError;
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;