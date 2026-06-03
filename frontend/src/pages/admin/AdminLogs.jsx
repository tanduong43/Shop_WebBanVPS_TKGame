// src/pages/admin/AdminLogs.jsx - Nhật ký hoạt động hệ thống (Audit Trail) dành cho Admin
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiActivity, FiSearch, FiRefreshCw, FiClock, FiUser, FiInfo } from 'react-icons/fi';
import Pagination from '../../components/Pagination';

// Helper màu sắc cho từng loại hành động
const getActionBadgeColor = (action) => {
  const act = String(action).toUpperCase();
  if (act.includes('ADJUST_BALANCE')) {
    return 'bg-red-500/10 text-red-400 border border-red-500/20'; // Đổi số dư: Đỏ (Quan trọng)
  }
  if (act.includes('DEACTIVATE_USER')) {
    return 'bg-orange-500/10 text-orange-400 border border-orange-500/20'; // Khóa user: Cam
  }
  if (act.includes('ACTIVATE_USER')) {
    return 'bg-green-500/10 text-green-400 border border-green-500/20'; // Kích hoạt user: Xanh lá
  }
  if (act.includes('CONFIRM_DEPOSIT')) {
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'; // Duyệt tiền: Emerald
  }
  if (act.includes('REJECT_DEPOSIT')) {
    return 'bg-pink-500/10 text-pink-400 border border-pink-500/20'; // Hủy tiền: Hồng
  }
  if (act.includes('UPDATE_SETTING')) {
    return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'; // Cài đặt: Vàng
  }
  if (act.includes('SPIN')) {
    return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'; // Vòng quay: Tím
  }
  return 'bg-white/10 text-white/60 border border-white/5'; // Các loại khác: Trắng/Xám
};

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getLogs({
        page: p,
        limit: 15,
        search: debouncedSearch,
      });
      setLogs(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setPage(res.data.pagination?.page || 1);
      setTotalLogs(res.data.pagination?.total || 0);
    } catch {
      toast.error('Không tải được lịch sử hoạt động');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiActivity className="text-primary-400" /> Nhật Ký Hoạt Động Admin
          </h1>
          <p className="text-white/50 text-sm mt-1">Lịch sử thao tác hệ thống (Audit Trail) của tài khoản quản trị viên</p>
        </div>
      </div>

      {/* Thông tin mô tả & Filter */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 text-[11px] text-white/40">
          <FiInfo className="text-sm text-primary-400 flex-shrink-0" />
          <p>
            Nhật ký ghi lại dấu vết toàn bộ các thao tác nhạy cảm liên quan đến sửa đổi cài đặt hệ thống, duyệt nạp tiền và chỉnh sửa tài khoản/số dư của người dùng. Hệ thống lưu trữ vĩnh viễn và không thể chỉnh sửa bởi bất kỳ tài khoản nào nhằm bảo đảm tính minh bạch.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Admin, hành động hoặc nội dung..."
              className="input-field pl-10 text-xs py-2.5"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-white/40 text-xs">Tổng số: {totalLogs} bản ghi</span>
            <button
              onClick={() => fetchData(page)}
              className="p-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
              title="Làm mới"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      {/* Bảng nhật ký */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 space-y-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Đang tải dữ liệu nhật ký...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">
            Không tìm thấy lịch sử hoạt động nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40 border-b border-white/5 uppercase tracking-wider">
                  <th className="py-3 px-4 w-40">Thời Gian</th>
                  <th className="py-3 px-4 w-48">Quản Trị Viên</th>
                  <th className="py-3 px-4 w-48">Hành Động</th>
                  <th className="py-3 px-4">Chi Tiết Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log._id} className="text-white/70 hover:bg-white/2 transition-colors">
                    {/* Thời gian */}
                    <td className="py-3 px-4 text-white/40 font-medium">
                      <span className="flex items-center gap-1.5 font-mono">
                        <FiClock className="text-white/20" />
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </td>

                    {/* Admin */}
                    <td className="py-3 px-4">
                      {log.adminId ? (
                        <div className="space-y-0.5">
                          <p className="text-white font-semibold flex items-center gap-1">
                            <FiUser className="text-white/30 text-[10px]" />
                            {log.adminId.username}
                          </p>
                          <p className="text-[10px] text-white/40">{log.adminId.email}</p>
                        </div>
                      ) : (
                        <span className="text-red-400 font-bold italic">Tài khoản đã bị xóa</span>
                      )}
                    </td>

                    {/* Hành động */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Chi tiết */}
                    <td className="py-3 px-4 text-white max-w-md break-words pr-6">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
}
