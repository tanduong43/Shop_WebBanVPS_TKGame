import { useMemo } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import NeonFishSchool from './components/NeonFishSchool';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex-1">
      <Outlet />
    </div>
    <Footer />
  </div>
);

const NotFound = () => (
  <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
    <div className="text-center glass-card p-10 max-w-md">
      <p className="text-6xl mb-4">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">Không tìm thấy trang</h1>
      <p className="text-white/50 mb-6">Đường dẫn không tồn tại hoặc đã bị thay đổi.</p>
      <a href="/" className="btn-primary inline-block">Về trang chủ</a>
    </div>
  </div>
);


const FloatingParticles = ({ count = 22 }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: `${((index * 37) % 100).toFixed(2)}%`,
        top: `${((index * 53 + 17) % 100).toFixed(2)}%`,
        size: 4 + (index % 5) * 2,
        duration: 14 + (index % 7) * 3,
        delay: -(index % 9) * 1.2,
        drift: 18 + (index % 6) * 8,
      })),
    [count],
  );

  return (
    <div className="floating-particles-layer" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="floating-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            '--particle-drift': `${particle.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  return (
    <>
      <FloatingParticles />

      <NeonFishSchool />
      <ScrollToTop />
      <Routes>
        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}
