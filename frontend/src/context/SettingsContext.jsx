import { createContext, useContext, useState, useEffect } from 'react';
import { publicAPI } from '../services/api';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shop_name: 'DuongKa Shop',
    shop_logo: '',
    boosting_enabled: true,
    games_enabled: true,
    trivia_enabled: true,
    deposit_enabled: true,
    wheel_enabled: true,
    baucua_enabled: true
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await publicAPI.getSettings();
      if (res.data?.data) {
        const newData = { ...res.data.data };
        // Ensure string booleans are converted to actual booleans
        Object.keys(newData).forEach(key => {
          if (newData[key] === 'true') newData[key] = true;
          if (newData[key] === 'false') newData[key] = false;
        });

        setSettings(prev => ({ ...prev, ...newData }));
        
        if (newData.shop_name) {
          document.title = `${newData.shop_name} - Shop VPS & Tài Khoản Game`;
        }
      }
    } catch (err) {
      console.error('Không thể lấy cấu hình hệ thống:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings phải được dùng trong SettingsProvider');
  }
  return context;
};
