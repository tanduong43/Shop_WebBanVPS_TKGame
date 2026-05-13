// src/pages/Profile.jsx - Trang thông tin cá nhân
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff,
  FiShield, FiCalendar, FiCheckCircle, FiKey,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

/* ─── Đổi mật khẩu ────────────────────────────────────────────── */
const ChangePasswordForm = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!form.newPassword) e.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (form.newPassword.length < 6) e.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!form.confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Đổi mật khẩu thành công! 🎉');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mật khẩu hiện tại */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Mật khẩu hiện tại</label>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type={show.current ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => { setForm({ ...form, currentPassword: e.target.value }); setErrors({ ...errors, currentPassword: '' }); }}
            placeholder="Nhập mật khẩu hiện tại"
            className={`input-field pl-11 pr-11 ${errors.currentPassword ? 'border-red-500/50' : ''}`}
          />
          <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
            {show.current ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-red-400 text-xs mt-1">{errors.currentPassword}</p>}
      </div>

      {/* Mật khẩu mới */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Mật khẩu mới</label>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type={show.new ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => { setForm({ ...form, newPassword: e.target.value }); setErrors({ ...errors, newPassword: '' }); }}
            placeholder="Tối thiểu 6 ký tự"
            className={`input-field pl-11 pr-11 ${errors.newPassword ? 'border-red-500/50' : ''}`}
          />
          <button type="button" onClick={() => setShow({ ...show, new: !show.new })}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
            {show.new ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
      </div>

      {/* Xác nhận mật khẩu mới */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">Xác nhận mật khẩu mới</label>
        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type={show.confirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }); }}
            placeholder="Nhập lại mật khẩu mới"
            className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
          />
          <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
            {show.confirm ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang cập nhật...
          </>
        ) : (
          <>
            <FiKey /> Đổi Mật Khẩu
          </>
        )}
      </button>
    </form>
  );
};

/* ─── Trang chính ──────────────────────────────────────────────── */
const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const avatarLetter = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* BG glows */}
      <div className="absolute top-1/4 left-1/5 w-80 h-80 bg-primary-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-accent-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container max-w-3xl animate-slide-up">
        {/* Header Card */}
        <div className="glass-card p-8 mb-6 relative overflow-hidden">
          {/* Decorative gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-4xl font-bold text-white shadow-glow-primary">
                {avatarLetter}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-dark-900 shadow-lg" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                {user?.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-xs font-medium">
                    <FiShield className="text-xs" /> Admin
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm mb-3">{user?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <FiCalendar />
                  Tham gia: {formatDate(user?.createdAt)}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <FiCheckCircle />
                  {user?.isActive ? 'Hoạt động' : 'Vô hiệu'}
                </span>
              </div>
            </div>

            {/* Sparkle icon */}
            <div className="hidden sm:block">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center">
                <HiSparkles className="text-primary-400 text-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'info', label: 'Thông Tin', icon: FiUser },
            { key: 'password', label: 'Đổi Mật Khẩu', icon: FiLock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`profile-tab-${key}`}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow-primary/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="text-base" />
              {label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className="glass-card p-8">
          {/* === Tab: Thông tin === */}
          {activeTab === 'info' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FiUser className="text-primary-400" /> Thông Tin Tài Khoản
              </h2>

              <div className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                    Tên đăng nhập
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                    <FiUser className="text-white/40 flex-shrink-0" />
                    <span className="text-white font-medium">{user?.username}</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                    <FiMail className="text-white/40 flex-shrink-0" />
                    <span className="text-white">{user?.email}</span>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                    Vai trò
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                    <FiShield className="text-white/40 flex-shrink-0" />
                    <span className={`font-medium ${user?.role === 'admin' ? 'text-primary-400' : 'text-white'}`}>
                      {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </div>
                </div>

                {/* Ngày tham gia */}
                <div>
                  <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                    Ngày tham gia
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                    <FiCalendar className="text-white/40 flex-shrink-0" />
                    <span className="text-white">{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Hint */}
              <p className="mt-6 text-xs text-white/30 text-center">
                Để thay đổi thông tin tài khoản, vui lòng liên hệ quản trị viên.
              </p>
            </div>
          )}

          {/* === Tab: Đổi mật khẩu === */}
          {activeTab === 'password' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FiLock className="text-primary-400" /> Đổi Mật Khẩu
              </h2>
              <p className="text-white/40 text-sm mb-6">
                Mật khẩu mới phải có ít nhất 6 ký tự.
              </p>
              <ChangePasswordForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
