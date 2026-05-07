// src/pages/admin/Dashboard.jsx - Admin dashboard (stats + recent orders)
import { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiRefreshCw } from 'react-icons/fi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="glass-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black gradient-text mt-1">{value}</p>
        {sub && <p className="text-white/40 text-xs mt-2">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="text-white text-xl" />
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="glass-card p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-3 w-40 rounded" />
      </div>
      <div className="skeleton h-11 w-11 rounded-2xl" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    const timer = setInterval(() => fetchDashboard(true), 5000); // realtime nhẹ
    return () => clearInterval(timer);
  }, []);

  const recentOrders = data?.recentOrders || [];

  const cards = useMemo(() => {
    const stats = data?.stats || {};
    return ([
    {
      label: 'Users',
      value: stats.totalUsers ?? '—',
      sub: 'Tổng người dùng (role=user)',
      icon: FiUsers,
      color: 'bg-gradient-to-br from-primary-500 to-accent-500',
    },
    {
      label: 'Products',
      value: stats.totalProducts ?? '—',
      sub: 'Sản phẩm đang active',
      icon: FiPackage,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      label: 'Orders',
      value: stats.totalOrders ?? '—',
      sub: `Pending: ${stats.pendingOrders ?? 0} • Completed: ${stats.completedOrders ?? 0}`,
      icon: FiShoppingBag,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    },
    {
      label: 'Revenue',
      value: stats.totalRevenue != null ? formatPrice(stats.totalRevenue) : '—',
      sub: 'Chỉ tính đơn completed',
      icon: FiDollarSign,
      color: 'bg-gradient-to-br from-green-500 to-teal-600',
    },
  ]);
  }, [data?.stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Dữ liệu tự cập nhật từ API</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : cards.map((c) => (
            <StatCard
              key={c.label}
              icon={c.icon}
              label={c.label}
              value={c.value}
              sub={c.sub}
              color={c.color}
            />
          ))}
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Đơn hàng gần đây</h2>
          <p className="text-white/40 text-xs">Top 5 mới nhất</p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-white/40 text-sm">Chưa có đơn hàng</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40">
                  <th className="py-2 pr-3">Mã</th>
                  <th className="py-2 pr-3">Khách</th>
                  <th className="py-2 pr-3">Trạng thái</th>
                  <th className="py-2 pr-3 text-right">Tổng</th>
                  <th className="py-2 pr-3">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.map((o) => (
                  <tr key={o._id} className="text-white/70">
                    <td className="py-3 pr-3 font-mono text-xs text-white/50">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 pr-3">
                      <p className="text-white">{o.userId?.username || '—'}</p>
                      <p className="text-white/40 text-xs">{o.userId?.email || ''}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`badge ${
                        o.status === 'completed' ? 'badge-completed'
                        : o.status === 'cancelled' ? 'badge-cancelled'
                        : 'badge-pending'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold">{formatPrice(o.totalPrice)}</td>
                    <td className="py-3 pr-3 text-white/40 text-xs">
                      {new Date(o.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

