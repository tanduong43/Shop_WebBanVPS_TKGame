// src/components/Navbar.jsx - Thanh điều hướng chính
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  FiShoppingCart, FiLogOut, FiMenu, FiX,
  FiShield, FiPackage, FiHome, FiGrid,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Đổi style navbar khi scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/',         label: 'Trang Chủ',  icon: FiHome },
    { to: '/products', label: 'Sản Phẩm',   icon: FiGrid },
    { to: '/orders',   label: 'Đơn Hàng',   icon: FiPackage, authRequired: true },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-dark-900/95 backdrop-blur-lg shadow-2xl border-b border-white/5' : 'bg-transparent'
    }`}>
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center group-hover:shadow-glow-primary transition-all duration-300">
              <HiSparkles className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">GameShop</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, authRequired }) => {
              if (authRequired && !isAuthenticated) return null;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="text-base" />
                  {label}
                </NavLink>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200">
              <FiShoppingCart className="text-xl" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary-500/30 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/80 hidden sm:block max-w-[100px] truncate">
                    {user?.username}
                  </span>
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card shadow-card animate-fade-in">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">{user?.username}</p>
                      <p className="text-xs text-white/40 truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary-400 font-medium">
                          <FiShield className="text-xs" /> Admin
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <FiShield /> Trang Admin
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/70 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <FiPackage /> Đơn Hàng
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <FiLogOut /> Đăng Xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Đăng Ký
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              {isMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-1 animate-slide-up">
            {navLinks.map(({ to, label, icon: Icon, authRequired }) => {
              if (authRequired && !isAuthenticated) return null;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-primary-500/20 text-primary-400' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon /> {label}
                </NavLink>
              );
            })}
            {!isAuthenticated && (
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-secondary text-center text-sm py-2">
                  Đăng Nhập
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary text-center text-sm py-2">
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
