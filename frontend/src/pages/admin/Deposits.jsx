// src/pages/admin/Deposits.jsx - Trang quản lý nạp tiền dành cho Admin
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import useSocket from '../../context/SocketContext';
import { toast } from 'react-toastify';
import {
  FiDollarSign, FiSearch, FiCheck, FiX, FiActivity,
  FiTrendingUp, FiClock, FiPlusCircle, FiUser, FiInfo
} from 'react-icons/fi';
import Pagination from '../../components/Pagination';

export default function AdminDeposits() {
  const socket = useSocket();

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Settings
  const [depositEnabled, setDepositEnabled] = useState(true);
  const [settingLoading, setSettingLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalDeposits: 0,
    completedDeposits: 0,
    pendingDeposits: 0,
    totalDepositAmount: 0,
    todayDepositAmount: 0,
  });

  // Modal điều chỉnh số dư trực tiếp cho User
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    userId: '',
    username: '',
    amount: '',
    description: 'Điều chỉnh số dư ví',
  });
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async (p = 1) => {
    setLoading(true);
    try {
      const [depositsRes, statsRes] = await Promise.all([
        adminAPI.getAllDeposits({
          page: p,
          limit: 10,
          status: statusFilter,
          search: debouncedSearch,
        }),
        adminAPI.getDepositStats(),
        adminAPI.getSettings(),
      ]);

      setDeposits(depositsRes.data.data);
      setTotalPages(depositsRes.data.pagination.totalPages);
      setPage(depositsRes.data.pagination.page);
      setStats(statsRes.data.data);
      if (settingsRes && settingsRes.data && settingsRes.data.data) {
        setDepositEnabled(settingsRes.data.data.deposit_enabled ?? true);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách nạp tiền');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, debouncedSearch]);

  // Lắng nghe Socket.IO realtime để làm mới bảng khi có đơn nạp mới hoặc nạp thành công
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe sự kiện để admin tự refresh số liệu realtime
    const handleRefresh = () => {
      fetchData(page);
    };

    socket.on('deposit:created', handleRefresh);
    socket.on('deposit:completed', handleRefresh);

    return () => {
      socket.off('deposit:created', handleRefresh);
      socket.off('deposit:completed', handleRefresh);
    };
  }, [socket, page, statusFilter, debouncedSearch]);

  // Duyệt nạp thủ công / Giả lập thành công Webhook
  const handleConfirm = async (id, orderCode) => {
    if (!window.confirm(`Duyệt/Giả lập nạp tiền thành công cho đơn #${orderCode}?`)) return;

    try {
      await adminAPI.confirmDeposit(id);
      toast.success(`Duyệt nạp tiền thành công đơn #${orderCode}! Realtime đã kích hoạt.`);
      fetchData(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý duyệt nạp');
    }
  };

  // Từ chối duyệt nạp
  const handleReject = async (id, orderCode) => {
    const reason = window.prompt('Nhập lý do hủy lệnh nạp tiền này:', 'Nội dung chuyển khoản không hợp lệ');
    if (reason === null) return; // Nhấn Cancel

    try {
      await adminAPI.rejectDeposit(id, reason);
      toast.warn(`Đã từ chối và hủy đơn nạp #${orderCode}`);
      fetchData(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý hủy đơn');
    }
  };

  // Mở modal điều chỉnh số dư ví user trực tiếp
  const openAdjustModal = (userObj) => {
    setAdjustForm({
      userId: userObj._id,
      username: userObj.username,
      amount: '',
      description: 'Điều chỉnh số dư ví bởi Admin',
    });
    setShowAdjustModal(true);
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(adjustForm.amount);
    
    if (isNaN(amountVal) || amountVal === 0) {
      toast.error('Số tiền phải là số hợp lệ và khác 0');
      return;
    }

    setAdjustLoading(true);
    try {
      await adminAPI.adjustUserBalance(
        adjustForm.userId,
        amountVal,
        adjustForm.description
      );
      toast.success(`Đã điều chỉnh thành công số dư cho user ${adjustForm.username}`);
      setShowAdjustModal(false);
      fetchData(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi điều chỉnh số dư');
    } finally {
      setAdjustLoading(false);
    }
  };

  // Toggle deposit feature
  const handleToggleDeposit = async () => {
    setSettingLoading(true);
    try {
      const newVal = !depositEnabled;
      await adminAPI.updateSetting('deposit_enabled', newVal);
      setDepositEnabled(newVal);
      toast.success(`Đã ${newVal ? 'BẬT' : 'TẮT'} chức năng nạp tiền`);
    } catch (err) {
      toast.error('Không thể thay đổi cài đặt nạp tiền');
    } finally {
      setSettingLoading(false);
    }
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

  return (
    <div className="space-y-6">
      
      {/* TIÊU ĐỀ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản Lý Nạp Tiền & Ví</h1>
          <p className="text-white/40 text-sm mt-1">Duyệt nạp tự động/thủ công, điều chỉnh ví và theo dõi doanh thu nạp</p>
        </div>
        
        <div className="glass-card px-4 py-2 flex items-center gap-3">
          <div>
            <p className="text-xs font-bold text-white">Chức năng Nạp Tiền</p>
            <p className="text-[10px] text-white/40">{depositEnabled ? 'Đang hoạt động' : 'Đang bảo trì'}</p>
          </div>
          <button
            onClick={handleToggleDeposit}
            disabled={settingLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              depositEnabled ? 'bg-green-500' : 'bg-white/10'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              depositEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Doanh thu nạp */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Tổng Doanh Thu Nạp</p>
              <p className="text-xl font-black text-green-400 mt-1">{formatPrice(stats.totalDepositAmount)}</p>
              <p className="text-[10px] text-white/30 mt-1">Tất cả thời gian</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
              <FiTrendingUp className="text-lg" />
            </div>
          </div>
        </div>

        {/* Tiền nạp hôm nay */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Nạp Tiền Hôm Nay</p>
              <p className="text-xl font-black text-primary-400 mt-1">{formatPrice(stats.todayDepositAmount)}</p>
              <p className="text-[10px] text-white/30 mt-1">Từ 00:00 hôm nay</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
              <FiDollarSign className="text-lg" />
            </div>
          </div>
        </div>

        {/* Tổng đơn nạp */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Tổng Lệnh Nạp</p>
              <p className="text-xl font-black text-white mt-1">{stats.totalDeposits}</p>
              <p className="text-[10px] text-white/30 mt-1">Lệnh tạo thành công</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <FiActivity className="text-lg" />
            </div>
          </div>
        </div>

        {/* Đơn hoàn thành */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Đơn Thành Công</p>
              <p className="text-xl font-black text-green-400 mt-1">{stats.completedDeposits}</p>
              <p className="text-[10px] text-white/30 mt-1">Tự động + Thủ công</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
              <FiCheck className="text-lg" />
            </div>
          </div>
        </div>

        {/* Đơn pending */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Đơn Chờ duyệt</p>
              <p className="text-xl font-black text-yellow-500 mt-1 animate-pulse">{stats.pendingDeposits}</p>
              <p className="text-[10px] text-white/30 mt-1">Cần đối soát / Giả lập</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <FiClock className="text-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & BẢNG DANH SÁCH */}
      <div className="glass-card p-6">
        
        {/* Bộ lọc */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm khách hàng, mã, nội dung ck..."
              className="input-field pl-10 text-xs py-2.5"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field text-xs py-2 bg-dark-900 border-white/10 text-white/70 w-full md:w-40"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="completed">Thành công</option>
              <option value="cancelled">Đã hủy</option>
              <option value="expired">Hết hạn</option>
            </select>

            <button
              onClick={() => fetchData(page)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
            >
              Làm Mới
            </button>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">
            Không tìm thấy dữ liệu nạp tiền khớp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40 border-b border-white/5 uppercase tracking-wider">
                  <th className="py-3 px-4">Đơn Nạp</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4 text-right">Số Tiền</th>
                  <th className="py-3 px-4">Nội Dung Chuyển Khoản</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Ngày Tạo</th>
                  <th className="py-3 px-4 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deposits.map((d) => (
                  <tr key={d._id} className="text-white/70 hover:bg-white/5 transition-colors">
                    
                    {/* Mã đơn */}
                    <td className="py-3 px-4 font-mono font-bold text-white/50">
                      #{d.orderCode}
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3 px-4">
                      {d.userId ? (
                        <div className="space-y-0.5">
                          <p className="text-white font-semibold flex items-center gap-1">
                            {d.userId.username}
                            <button
                              onClick={() => openAdjustModal(d.userId)}
                              title="Điều chỉnh số dư ví của User này"
                              className="text-primary-400 hover:text-primary-300 p-0.5"
                            >
                              <FiPlusCircle className="text-xs" />
                            </button>
                          </p>
                          <p className="text-[10px] text-white/40">{d.userId.email}</p>
                        </div>
                      ) : (
                        <span className="text-red-400 font-bold italic">User bị xóa</span>
                      )}
                    </td>

                    {/* Số tiền */}
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {formatPrice(d.amount)}
                    </td>

                    {/* Nội dung bank */}
                    <td className="py-3 px-4 font-mono font-black text-primary-400 bg-white/5 rounded-md px-2 py-0.5 border border-white/5 inline-block my-2">
                      {d.transferContent}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase ${
                        d.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : d.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : d.status === 'expired' ? 'bg-white/10 text-white/40'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                      }`}>
                        {d.status === 'completed' ? 'Thành công'
                          : d.status === 'cancelled' ? 'Đã hủy'
                          : d.status === 'expired' ? 'Hết hạn'
                          : 'Chờ thanh toán'}
                      </span>
                    </td>

                    {/* Ngày */}
                    <td className="py-3 px-4 text-white/40">
                      {new Date(d.createdAt).toLocaleString('vi-VN')}
                    </td>

                    {/* Hành động (Giả lập Sandbox / Hủy) */}
                    <td className="py-3 px-4 text-center">
                      {d.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleConfirm(d._id, d.orderCode)}
                            className="px-2 py-1 rounded bg-green-500 text-white font-extrabold hover:bg-green-600 transition-colors shadow-glow-primary text-[10px]"
                            title="Mô phỏng Webhook thành công / Duyệt nạp thủ công"
                          >
                            Simulate Webhook
                          </button>
                          <button
                            onClick={() => handleReject(d._id, d.orderCode)}
                            className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                            title="Hủy đơn nạp này"
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30 italic">
                          {d.status === 'completed' ? 'Đã cộng tiền' : 'Giao dịch đóng'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-end">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}

      </div>

      {/* ── MODAL ĐIỀU CHỈNH SỐ DƯ VÍ ── */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdjustModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FiUser className="text-primary-400" /> Điều Chỉnh Số Dư
            </h2>
            <p className="text-xs text-white/40 mb-6">
              Bạn đang thay đổi số dư ví trực tiếp cho tài khoản: <span className="text-white font-bold">{adjustForm.username}</span>
            </p>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Số tiền muốn thay đổi (VNĐ)</label>
                <input
                  type="number"
                  placeholder="Cộng tiền nhập số dương (e.g. 50000), trừ tiền nhập số âm (e.g. -50000)"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="input-field py-2 text-xs font-bold text-white"
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
                  Việc điều chỉnh số dư sẽ lập tức ghi lại nhật ký biến động ví (Transaction) để đảm bảo kế toán thống kê chuẩn xác. User sẽ nhận được thông báo biến động số dư realtime.
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
                  className="btn-primary px-5 py-2 text-xs font-bold hover:shadow-glow-primary"
                >
                  {adjustLoading ? 'Đang xử lý...' : 'Xác Nhận Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
