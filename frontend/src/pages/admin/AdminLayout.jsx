// src/pages/admin/AdminLayout.jsx - Layout sidebar cho admin
import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiLogOut,
  FiMenu, FiChevronRight, FiHome,
} from 'react-icons/fi';
import logo from '../../assets/logo.png';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, exact: true },
  { to: '/admin/products', label: 'Sản Phẩm', icon: FiPackage },
  { to: '/admin/orders', label: 'Đơn Hàng', icon: FiShoppingBag },
  { to: '/admin/users', label: 'Người Dùng', icon: FiUsers },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DK logo" className="w-9 h-9 rounded-xl object-cover shadow-glow-primary" />
          <div>
            <p className="text-white font-bold text-sm">DuongKa Admin</p>
            <p className="text-white/40 text-xs">{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow-primary/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="text-base" />
            {label}
            <FiChevronRight className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <button
          onClick={() => { setSidebarOpen(false); navigate('/'); }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-primary-400 hover:bg-primary-500/10 transition-all"
        >
          <FiHome /> Về Trang Chủ
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <FiLogOut /> Đăng Xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-dark-900/80 border-r border-white/5 backdrop-blur-sm flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-dark-900 border-r border-white/5 flex flex-col animate-slide-in-right">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-dark-950/80 backdrop-blur-sm border-b border-white/5 px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <FiMenu className="text-xl" />
          </button>
          <div className="hidden lg:block">
            <p className="text-white/60 text-sm">Xin chào, <span className="text-white font-semibold">{user?.username}</span> 👋</p>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/40 text-xs">Online</span>
            </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
