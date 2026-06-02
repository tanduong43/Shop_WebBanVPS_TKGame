// src/pages/admin/Users.jsx - Admin manage users
import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiSearch, FiTrash2, FiRotateCcw, FiPlusCircle, FiMinusCircle, FiInfo } from 'react-icons/fi';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modal điều chỉnh số dư ví user
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustMode, setAdjustMode] = useState('add'); // 'add' | 'subtract'
  const [adjustForm, setAdjustForm] = useState({
    userId: '',
    username: '',
    amount: '',
    description: 'Điều chỉnh số dư ví bởi Admin',
  });
  const [adjustLoading, setAdjustLoading] = useState(false);

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

  const openAdjustModal = (u, mode = 'add') => {
    setAdjustMode(mode);
    setAdjustForm({
      userId: u._id,
      username: u.username,
      amount: '',
      description: mode === 'subtract'
        ? 'Admin trừ tiền ví'
        : 'Admin cộng tiền ví',
    });
    setShowAdjustModal(true);
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    const raw = parseFloat(adjustForm.amount);

    if (isNaN(raw) || raw <= 0) {
      toast.error('Số tiền phải là số dương hợp lệ');
      return;
    }

    const amountVal = adjustMode === 'subtract' ? -raw : raw;

    setAdjustLoading(true);
    try {
      await adminAPI.adjustUserBalance(
        adjustForm.userId,
        amountVal,
        adjustForm.description
      );
      toast.success(
        adjustMode === 'subtract'
          ? `Đã trừ ${raw.toLocaleString()}đ khỏi ví user ${adjustForm.username}`
          : `Đã cộng ${raw.toLocaleString()}đ vào ví user ${adjustForm.username}`
      );
      setShowAdjustModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi điều chỉnh số dư');
    } finally {
      setAdjustLoading(false);
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
                <th className="p-4">Số dư</th>
                <th className="p-4">Role</th>
                <th className="p-4">Active</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}><td className="p-4" colSpan={6}><div className="skeleton h-8 w-full rounded-xl" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td className="p-6 text-white/40" colSpan={6}>Không có user</td></tr>
              ) : (
                items.map((u) => (
                  <tr key={u._id} className="text-white/70">
                    <td className="p-4">
                      <p className="text-white font-medium flex items-center gap-2">
                        {u.username}
                      </p>
                      <p className="text-white/40 text-xs">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 font-mono font-bold text-green-400">
                      {(u.balance || 0).toLocaleString()}đ
                    </td>
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
                        <button
                          onClick={() => openAdjustModal(u, 'add')}
                          className="px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition-all inline-flex items-center gap-2"
                        >
                          <FiPlusCircle /> Cộng tiền
                        </button>
                        <button
                          onClick={() => openAdjustModal(u, 'subtract')}
                          className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all inline-flex items-center gap-2"
                        >
                          <FiMinusCircle /> Trừ tiền
                        </button>
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

      {/* ── MODAL ĐIỀU CHỈNH SỐ DƯ VÍ ── */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdjustModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              {adjustMode === 'subtract' ? (
                <FiMinusCircle className="text-amber-400" />
              ) : (
                <FiPlusCircle className="text-primary-400" />
              )}
              {adjustMode === 'subtract' ? 'Trừ Tiền Ví' : 'Cộng Tiền Ví'}
            </h2>
            <p className="text-xs text-white/40 mb-6">
              {adjustMode === 'subtract' ? 'Trừ số dư' : 'Cộng số dư'} cho tài khoản:{' '}
              <span className="text-white font-bold">{adjustForm.username}</span>
            </p>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">
                  Số tiền {adjustMode === 'subtract' ? 'trừ' : 'cộng'} (VNĐ)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={adjustMode === 'subtract' ? 'VD: 50000' : 'VD: 50000'}
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className={`input-field py-2 text-xs font-bold text-white ${
                    adjustMode === 'subtract' ? 'border-amber-500/30 focus:border-amber-500/50' : ''
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={adjustForm.description}
                  onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                  className="input-field py-2 text-xs text-white/70"
                  required
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/40">
                <FiInfo className="text-sm text-primary-400 flex-shrink-0" />
                <p>
                  Việc điều chỉnh số dư sẽ lập tức ghi lại nhật ký biến động ví (Transaction). User sẽ nhận được thông báo biến động số dư realtime.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-white/60 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className={`px-5 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50 ${
                    adjustMode === 'subtract'
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'btn-primary hover:shadow-glow-primary'
                  }`}
                >
                  {adjustLoading
                    ? 'Đang xử lý...'
                    : adjustMode === 'subtract'
                      ? 'Xác Nhận Trừ Tiền'
                      : 'Xác Nhận Cộng Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

