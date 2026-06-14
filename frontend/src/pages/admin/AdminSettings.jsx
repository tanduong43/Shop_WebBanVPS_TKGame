import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-toastify';
import { FiSettings, FiImage, FiType, FiPlay, FiServer, FiSave } from 'react-icons/fi';

export default function AdminSettings() {
  const { settings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_logo: '',
    boosting_enabled: true,
    games_enabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      shop_name: settings.shop_name || '',
      shop_logo: settings.shop_logo || '',
      boosting_enabled: settings.boosting_enabled !== false,
      games_enabled: settings.games_enabled !== false,
    });
  }, [settings]);

  const handleToggle = (key) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Gọi API cập nhật từng key
      await Promise.all([
        adminAPI.updateSetting('shop_name', formData.shop_name),
        adminAPI.updateSetting('shop_logo', formData.shop_logo),
        adminAPI.updateSetting('boosting_enabled', formData.boosting_enabled),
        adminAPI.updateSetting('games_enabled', formData.games_enabled),
      ]);
      toast.success('Đã lưu cấu hình chung!');
      refreshSettings();
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiSettings className="text-primary-400" /> Cài Đặt Hệ Thống
        </h1>
        <p className="text-white/40 text-sm mt-1">Tuỳ chỉnh giao diện và các tính năng hiển thị trên trang chủ</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <FiType className="text-accent-400" /> Thông tin Shop
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Tên Shop (Hiển thị trên Navbar & Tiêu đề Web)</label>
            <input 
              type="text" 
              value={formData.shop_name}
              onChange={e => setFormData({ ...formData, shop_name: e.target.value })}
              className="input-field max-w-md"
              placeholder="VD: DuongKa Shop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Đường dẫn Logo (URL Ảnh)</label>
            <div className="flex gap-4 items-start">
              <input 
                type="text" 
                value={formData.shop_logo}
                onChange={e => setFormData({ ...formData, shop_logo: e.target.value })}
                className="input-field max-w-md"
                placeholder="VD: https://imgur.com/xxx.png"
              />
              <div className="w-12 h-12 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {formData.shop_logo ? (
                  <img src={formData.shop_logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <FiImage className="text-white/20 text-xl" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-1">Để trống nếu muốn dùng Logo mặc định.</p>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
            <FiPlay className="text-green-400" /> Bật / Tắt Tính Năng
          </h2>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900 border border-white/5 max-w-md">
            <div>
              <p className="font-semibold text-white flex items-center gap-2"><FiServer className="text-orange-400" /> Tính năng Treo Thuê</p>
              <p className="text-xs text-white/40 mt-0.5">Hiển thị mục Cày thuê trên Menu và Trang chủ</p>
            </div>
            <button
              onClick={() => handleToggle('boosting_enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.boosting_enabled ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.boosting_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-900 border border-white/5 max-w-md">
            <div>
              <p className="font-semibold text-white flex items-center gap-2"><FiPlay className="text-primary-400" /> Menu Games</p>
              <p className="text-xs text-white/40 mt-0.5">Hiển thị mục Games trên Menu và Trang chủ</p>
            </div>
            <button
              onClick={() => handleToggle('games_enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.games_enabled ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.games_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            <FiSave /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
