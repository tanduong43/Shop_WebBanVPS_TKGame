// src/pages/admin/AdminSpinHistory.jsx - Trang xem lịch sử quay thưởng toàn hệ thống dành cho Admin
import { useState, useEffect } from 'react';
import { adminWheelAPI } from '../../services/api';
import { FiSearch, FiCompass, FiClock, FiUser, FiActivity } from 'react-icons/fi';
import Pagination from '../../components/Pagination';

export default function AdminSpinHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search
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

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminWheelAPI.getHistory({
        page: p,
        limit: 15,
        search: debouncedSearch,
      });
      setHistory(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (err) {
      console.error('Không thể lấy lịch sử quay thưởng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page, debouncedSearch]);

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

  return (
    <div className="space-y-6">
      
      {/* TIÊU ĐỀ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Lịch Sử Trúng Thưởng</h1>
          <p className="text-white/40 text-sm mt-1 font-normal">Nhật ký chi tiết các lượt quay, chi phí và phần thưởng của toàn bộ khách hàng</p>
        </div>
      </div>

      {/* KHU VỰC BẢNG LỊCH SỬ */}
      <div className="glass-card p-6">
        
        {/* Tìm kiếm */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên người chơi..."
              className="input-field pl-10 text-xs py-2.5"
            />
          </div>
          <button
            onClick={() => fetchHistory(page)}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
          >
            Làm Mới
          </button>
        </div>

        {/* Bảng dữ liệu */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">
            Không tìm thấy lịch sử quay thưởng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40 border-b border-white/5 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Người chơi</th>
                  <th className="py-3 px-4">Vòng quay</th>
                  <th className="py-3 px-4 text-right">Chi Phí</th>
                  <th className="py-3 px-4">Phần Thưởng Trúng</th>
                  <th className="py-3 px-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((h) => (
                  <tr key={h._id} className="text-white/70 hover:bg-white/5 transition-colors">
                    
                    {/* Người chơi */}
                    <td className="py-3 px-4">
                      {h.userId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-black text-white">
                            {h.userId.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold flex items-center gap-1">
                              {h.userId.username}
                            </p>
                            <p className="text-[10px] text-white/40">{h.userId.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-400 font-bold italic">User bị xóa</span>
                      )}
                    </td>

                    {/* Vòng quay */}
                    <td className="py-3 px-4 font-semibold text-white/90">
                      {h.wheelId?.name || <span className="text-white/30 italic">Vòng quay bị xóa</span>}
                    </td>

                    {/* Giá tiền */}
                    <td className="py-3 px-4 text-right font-mono text-white/50">
                      -{formatPrice(h.price)}
                    </td>

                    {/* Phần thưởng trúng */}
                    <td className="py-3 px-4">
                      {h.prizeId ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: h.prizeId.color }} />
                          <span className="font-bold text-white" style={{ color: h.prizeId.color }}>
                            {h.prizeId.name}
                          </span>
                          {h.prizeId.isJackpot && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-pink-500/20 text-pink-500 border border-pink-500/30 uppercase tracking-widest animate-pulse">
                              Jackpot
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/30 italic">Giải thưởng bị xóa</span>
                      )}
                    </td>

                    {/* Ngày */}
                    <td className="py-3 px-4 text-white/40">
                      {new Date(h.createdAt).toLocaleString('vi-VN')}
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

    </div>
  );
}
