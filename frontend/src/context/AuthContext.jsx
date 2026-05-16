// src/context/AuthContext.jsx - Quản lý trạng thái xác thực
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Loading khi khởi tạo

  // Khởi tạo: lấy user từ localStorage
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser  = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify token vẫn còn hợp lệ
          const res = await authAPI.getProfile();
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        } catch {
          // Token hết hạn → clear
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Đăng nhập
  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: userToken } = res.data.data;
    
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    
    toast.success(`Chào mừng trở lại, ${userData.username}! 🎉`);
    return userData;
  }, []);

  // Đăng ký
  const register = useCallback(async (username, email, password, captchaId, captchaAnswer) => {
    const res = await authAPI.register({ username, email, password, captchaId, captchaAnswer });
    const { user: userData, token: userToken } = res.data.data;
    
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    
    toast.success(`Đăng ký thành công! Chào mừng ${userData.username} 🎊`);
    return userData;
  }, []);

  // Đăng xuất
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('Đã đăng xuất');
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated, isAdmin,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng trong AuthProvider');
  return context;
};

export default AuthContext;
