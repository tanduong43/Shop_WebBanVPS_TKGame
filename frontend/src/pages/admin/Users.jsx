// src/pages/admin/Users.jsx - Admin manage users
import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiSearch, FiTrash2, FiRotateCcw } from 'react-icons/fi';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 12, search });
      setItems(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const disableUser = async (u) => {
    if (!confirm(`Vô hiệu hóa user "${u.username}"?`)) return;
    setWorkingId(u._id);
    try {
      await adminAPI.deleteUser(u._id);
      toast.success('Đã vô hiệu hóa user');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setWorkingId(null);
    }
  };

  const restoreUser = async (u) => {
    setWorkingId(u._id);
    try {
      await adminAPI.restoreUser(u._id);
      toast.success('Đã khôi phục user');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Người dùng</h1>
          <p className="text-white/40 text-sm mt-1">Xem danh sách và vô hiệu hóa tài khoản</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary py-2 px-4 text-sm inline-flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="glass-card p-4 flex gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-11"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo username/email..."
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3">
              <tr className="text-left text-white/40">
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Active</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}><td className="p-4" colSpan={5}><div className="skeleton h-8 w-full rounded-xl" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td className="p-6 text-white/40" colSpan={5}>Không có user</td></tr>
              ) : (
                items.map((u) => (
                  <tr key={u._id} className="text-white/70">
                    <td className="p-4">
                      <p className="text-white font-medium">{u.username}</p>
                      <p className="text-white/40 text-xs">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`badge ${u.role === 'admin' ? 'badge-vps' : 'badge-game'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${u.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                        {u.isActive ? 'yes' : 'no'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {u.isActive ? (
                          <button
                            onClick={() => disableUser(u)}
                            disabled={workingId === u._id || u.role === 'admin'}
                            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                          >
                            <FiTrash2 /> Vô hiệu hóa
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreUser(u)}
                            disabled={workingId === u._id}
                            className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                          >
                            <FiRotateCcw /> Khôi phục
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between gap-3">
            <p className="text-white/40 text-xs">
              Trang {pagination.page} / {pagination.totalPages} • {pagination.total} users
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

