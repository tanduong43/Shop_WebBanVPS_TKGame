// src/pages/admin/Orders.jsx - Admin manage orders
import { useCallback, useEffect, useState } from 'react';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p || 0));

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'pending_contact', label: 'pending_contact' },
  { value: 'completed', label: 'completed' },
  { value: 'cancelled', label: 'cancelled' },
];

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAllOrders({ page, limit: 12, status });
      let list = res.data.data || [];
      // Simple client-side search by id/email/username
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        list = list.filter((o) =>
          o._id.toLowerCase().includes(needle) ||
          (o.userId?.username || '').toLowerCase().includes(needle) ||
          (o.userId?.email || '').toLowerCase().includes(needle)
        );
      }
      setItems(list);
      setPagination(res.data.pagination);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      await orderAPI.updateStatus(orderId, { status: nextStatus });
      toast.success('Đã cập nhật trạng thái');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Đơn hàng</h1>
          <p className="text-white/40 text-sm mt-1">Xem tất cả và cập nhật trạng thái</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary py-2 px-4 text-sm inline-flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="glass-card p-4 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-11"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã đơn / username / email..."
          />
        </div>
        <select
          className="input-field lg:w-64 cursor-pointer"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} className="bg-dark-800">{s.label}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3">
              <tr className="text-left text-white/40">
                <th className="p-4">Mã</th>
                <th className="p-4">Khách</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4 text-right">Tổng</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}><td className="p-4" colSpan={6}><div className="skeleton h-8 w-full rounded-xl" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td className="p-6 text-white/40" colSpan={6}>Không có đơn hàng</td></tr>
              ) : (
                items.map((o) => (
                  <tr key={o._id} className="text-white/70">
                    <td className="p-4 font-mono text-xs text-white/50">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="p-4">
                      <p className="text-white">{o.userId?.username || '—'}</p>
                      <p className="text-white/40 text-xs">{o.userId?.email || ''}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white/70 text-xs">{o.items?.length || 0} items</p>
                      <p className="text-white/40 text-xs line-clamp-1">
                        {(o.items || []).slice(0, 2).map((it) => it.name).join(', ')}{(o.items || []).length > 2 ? '…' : ''}
                      </p>
                    </td>
                    <td className="p-4 text-right font-semibold">{formatPrice(o.totalPrice)}</td>
                    <td className="p-4">
                      <select
                        className="input-field py-2 px-3 text-sm cursor-pointer"
                        value={o.status}
                        disabled={updatingId === o._id}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                      >
                        <option value="pending_contact" className="bg-dark-800">pending_contact</option>
                        <option value="completed" className="bg-dark-800">completed</option>
                        <option value="cancelled" className="bg-dark-800">cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-white/40 text-xs">{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between gap-3">
            <p className="text-white/40 text-xs">
              Trang {pagination.page} / {pagination.totalPages} • {pagination.total} đơn
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

