// src/pages/Register.jsx - Trang đăng ký
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { toast } from 'react-toastify';

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]         = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Username phải có ít nhất 3 ký tự';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username))    e.username = 'Username chỉ chứa chữ, số và gạch dưới';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password || form.password.length < 6) e.password = 'Password phải có ít nhất 6 ký tự';
    if (form.password !== form.confirmPassword)     e.confirmPassword = 'Mật khẩu không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, val) => {
    setForm({ ...form, [field]: val });
    setErrors({ ...errors, [field]: '' });
  };

  // Password strength
  const strength = [
    form.password.length >= 6,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^a-zA-Z0-9]/.test(form.password),
  ];
  const strengthScore = strength.filter(Boolean).length;
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][strengthScore - 1] || 'bg-dark-700';

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md px-4 animate-slide-up">
        <div className="text-center mb-8">
          <img src={logo} alt="DK logo" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-glow-primary hover:scale-105 transition-transform" />
          <h1 className="text-3xl font-bold text-white">Tạo Tài Khoản</h1>
          <p className="text-white/50 mt-2">Đăng ký để bắt đầu mua sắm!</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Username</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="text" value={form.username} onChange={(e) => setField('username', e.target.value)}
                  placeholder="gamerpro123" className={`input-field pl-11 ${errors.username ? 'border-red-500/50' : ''}`} />
              </div>
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                  placeholder="example@email.com" className={`input-field pl-11 ${errors.email ? 'border-red-500/50' : ''}`} />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Mật khẩu</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)}
                  placeholder="••••••••" className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-500/50' : ''}`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strengthScore ? strengthColor : 'bg-dark-700'}`} />
                  ))}
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="••••••••" className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'border-red-500/50' : ''}`} />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <FiCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tạo tài khoản...</>
              ) : 'Đăng Ký Ngay'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
