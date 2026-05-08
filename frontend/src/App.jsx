import { useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
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

const CursorGlow = () => {
  const layerRef = useRef(null);
  const initialPos = {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  };
  const targetPosRef = useRef({
    ...initialPos,
  });
  const currentPosRef = useRef({ ...initialPos });
  const rafRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return undefined;

    const handleMove = (event) => {
      targetPosRef.current.x = event.clientX;
      targetPosRef.current.y = event.clientY;
    };

    const animate = () => {
      const dx = targetPosRef.current.x - currentPosRef.current.x;
      const dy = targetPosRef.current.y - currentPosRef.current.y;

      currentPosRef.current.x += dx * 0.12;
      currentPosRef.current.y += dy * 0.12;

      if (layerRef.current) {
        layerRef.current.style.setProperty('--glow-x', `${currentPosRef.current.x}px`);
        layerRef.current.style.setProperty('--glow-y', `${currentPosRef.current.y}px`);
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className="cursor-glow-layer"
      aria-hidden="true"
      style={{ '--glow-x': '50vw', '--glow-y': '50vh' }}
    >
      <span className="cursor-glow glow-primary" />
      <span className="cursor-glow glow-secondary" />
      <span className="cursor-glow glow-accent" />
    </div>
  );
};

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
      <CursorGlow />
      <NeonFishSchool />
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
