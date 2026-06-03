// src/pages/admin/AdminWheels.jsx - Trang quản lý Vòng quay & Phá Cưa dành cho Admin
import { useState, useEffect } from 'react';
import { adminWheelAPI, adminBauCuaAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  FiSettings, FiPlusCircle, FiEdit2, FiTrash2, FiInfo,
  FiAward, FiDollarSign, FiPercent, FiLayers, FiCheck, FiAlertTriangle,
  FiPlay, FiPause, FiGrid, FiTrendingUp, FiSearch,
} from 'react-icons/fi';

// ─── BầU CUA ROOM MANAGEMENT PANEL ────────────────────────────────────────────
function BauCuaRoomsPanel() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', description: '', minBet: 1000, maxBet: 500000 });

  // Thống kê phòng
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedRoomForStats, setSelectedRoomForStats] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsSearch, setStatsSearch] = useState('');
  const [statsSort, setStatsSort] = useState('profit_desc');
  const [statsPage, setStatsPage] = useState(1);
  const [statsTotalPages, setStatsTotalPages] = useState(1);
  const [statsTotal, setStatsTotal] = useState(0);

  const fetchRoomStats = async (room, page = 1, search = '', sortBy = 'profit_desc') => {
    if (!room) return;
    setStatsLoading(true);
    try {
      const res = await adminBauCuaAPI.getRoomStats(room._id, {
        page,
        limit: 10,
        search,
        sortBy
      });
      setStatsData(res.data.data);
      setStatsTotal(res.data.pagination.total);
      setStatsTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Không thể tải thống kê của phòng này');
    } finally {
      setStatsLoading(false);
    }
  };

  const openStatsModal = (room) => {
    setSelectedRoomForStats(room);
    setStatsSearch('');
    setStatsSort('profit_desc');
    setStatsPage(1);
    setShowStatsModal(true);
    fetchRoomStats(room, 1, '', 'profit_desc');
  };

  const handleStatsSearchChange = (e) => {
    const val = e.target.value;
    setStatsSearch(val);
    setStatsPage(1);
    fetchRoomStats(selectedRoomForStats, 1, val, statsSort);
  };

  const handleStatsSortChange = (e) => {
    const val = e.target.value;
    setStatsSort(val);
    setStatsPage(1);
    fetchRoomStats(selectedRoomForStats, 1, statsSearch, val);
  };

  const handleStatsPageChange = (newPage) => {
    if (newPage < 1 || newPage > statsTotalPages) return;
    setStatsPage(newPage);
    fetchRoomStats(selectedRoomForStats, newPage, statsSearch, statsSort);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await adminBauCuaAPI.getAllRooms();
      setRooms(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const openModal = (room = null) => {
    if (room) {
      setForm({ id: room._id, name: room.name, description: room.description || '', minBet: room.minBet, maxBet: room.maxBet });
    } else {
      setForm({ id: '', name: '', description: '', minBet: 1000, maxBet: 500000 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await adminBauCuaAPI.updateRoom(form.id, form);
        toast.success('Cập nhật phòng thành công');
      } else {
        await adminBauCuaAPI.createRoom(form);
        toast.success('Tạo phòng thành công');
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggle = async (room) => {
    try {
      await adminBauCuaAPI.toggleRoom(room._id);
      toast.success(`Phòng đã được ${room.isActive ? 'Tắt' : 'Bật'}`);
      fetchRooms();
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái phòng');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa phòng "${name}"? Toàn bộ lịch sử sẽ bị xóa!`)) return;
    try {
      await adminBauCuaAPI.deleteRoom(id);
      toast.success('Xóa phòng thành công');
      fetchRooms();
    } catch {
      toast.error('Không thể xóa phòng');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Quản Lý Phòng Bầu Cua</h2>
          <p className="text-white/40 text-xs mt-1">Tạo và quản lý các phòng chơi Bầu Cua Tôm Cá real-time</p>
        </div>
        <button onClick={() => openModal(null)} className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
          <FiPlusCircle /> Tạo Phòng Mới
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/30 text-sm">
          Chưa có phòng nào. Nhấn Tạo Phòng Mới để bắt đầu!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room._id} className={`glass-card p-5 space-y-3 border-l-4 ${
              room.isActive ? 'border-l-green-500' : 'border-l-white/10'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-sm text-white">{room.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{room.description || 'Không có mô tả'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  room.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/5'
                }`}>
                  {room.isActive ? 'Đang chạy' : 'Đã dừng'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/30">Cược tối thiểu</p>
                  <p className="font-bold text-green-400">{room.minBet.toLocaleString()}đ</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/30">Cược tối đa</p>
                  <p className="font-bold text-red-400">{room.maxBet.toLocaleString()}đ</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/30">Tổng ván</p>
                  <p className="font-bold text-white">{room.totalRounds}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-white/30">Doanh số</p>
                  <p className="font-bold text-amber-400">{(room.totalVolume || 0).toLocaleString()}đ</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={() => openStatsModal(room)}
                  className="w-full py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                  title="Xem thống kê thắng thua"
                >
                  <FiTrendingUp className="text-xs" /> Xem Thống Kê Thắng/Thua
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(room)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                      room.isActive
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    {room.isActive ? <><FiPause /> Dừng</> : <><FiPlay /> Chạy</>}
                  </button>
                  <button onClick={() => openModal(room)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/60 hover:text-white" title="Sửa">
                    <FiEdit2 className="text-xs" />
                  </button>
                  <button onClick={() => handleDelete(room._id, room.name)} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" title="Xóa">
                    <FiTrash2 className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO/SỬA PHÒNG */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <FiGrid className="text-amber-400" />
              {form.id ? 'Cập Nhật Phòng' : 'Tạo Phòng Mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Tên phòng</label>
                <input type="text" placeholder="Ví dụ: Phòng Chân Gà, Phòng VIP"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field text-xs py-2" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Mô tả</label>
                <input type="text" placeholder="Mô tả ngắn về phòng..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field text-xs py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-2">Cược tối thiểu (đ)</label>
                  <input type="number" min={1000} max={500000} step={1000}
                    value={form.minBet} onChange={e => setForm({ ...form, minBet: parseInt(e.target.value) })}
                    className="input-field text-xs py-2 font-mono" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-2">Cược tối đa (đ)</label>
                  <input type="number" min={1000} max={500000} step={1000}
                    value={form.maxBet} onChange={e => setForm({ ...form, maxBet: parseInt(e.target.value) })}
                    className="input-field text-xs py-2 font-mono" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-white/60 hover:bg-white/10">
                  Hủy
                </button>
                <button type="submit" className="btn-primary px-5 py-2 text-xs font-bold">
                  {form.id ? 'Lưu' : 'Tạo Phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THỐNG KÊ PHÒNG BẦU CUA */}
      {showStatsModal && selectedRoomForStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStatsModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-4xl animate-scale-in max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FiTrendingUp className="text-amber-400 text-lg" />
                Thống Kê Thắng/Thua — {selectedRoomForStats.name}
              </h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-white/40 hover:text-white text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Đóng
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 py-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Tìm kiếm username hoặc email..."
                  value={statsSearch}
                  onChange={handleStatsSearchChange}
                  className="input-field pl-9 pr-4 py-2 text-xs w-full"
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={statsSort}
                  onChange={handleStatsSortChange}
                  className="input-field py-2 text-xs w-full bg-dark-900 border-white/10 text-white"
                >
                  <option value="profit_desc">Thắng nhiều nhất</option>
                  <option value="profit_asc">Thua nhiều nhất</option>
                  <option value="bet_desc">Cược nhiều nhất</option>
                  <option value="win_desc">Thắng nhiều nhất (giao dịch)</option>
                  <option value="rounds_desc">Chơi nhiều ván nhất</option>
                </select>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {statsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/40 text-xs gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                  Đang tải dữ liệu...
                </div>
              ) : statsData.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-white/30 text-xs">
                  Không tìm thấy dữ liệu thống kê nào.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="text-white/40 border-b border-white/5 uppercase tracking-wider font-bold">
                        <th className="py-3 px-3">Người chơi</th>
                        <th className="py-3 px-3 text-center">Số ván chơi</th>
                        <th className="py-3 px-3 text-right">Tổng cược</th>
                        <th className="py-3 px-3 text-right">Tổng thắng</th>
                        <th className="py-3 px-3 text-right">Lợi nhuận ròng</th>
                        <th className="py-3 px-3 text-center">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {statsData.map((row) => {
                        const isWinner = row.netProfit > 0;
                        const isLoser = row.netProfit < 0;
                        return (
                          <tr key={row.userId} className="text-white/70 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3">
                              <p className="font-bold text-white text-xs">{row.username}</p>
                              <p className="text-[10px] text-white/30 font-mono">{row.email}</p>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-white/80">
                              {row.roundsPlayed}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-white/80">
                              {row.totalBet.toLocaleString()}đ
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-white/80">
                              {row.totalWin.toLocaleString()}đ
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-black ${
                              isWinner ? 'text-green-400' : isLoser ? 'text-red-400' : 'text-white/40'
                            }`}>
                              {isWinner ? '+' : ''}{row.netProfit.toLocaleString()}đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                isWinner 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : isLoser 
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                    : 'bg-white/5 text-white/30'
                              }`}>
                                {isWinner ? 'Thắng (Ăn)' : isLoser ? 'Thua' : 'Hòa'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination footer */}
            {!statsLoading && statsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                <span className="text-[10px] text-white/40">
                  Tổng cộng: <strong className="text-white/70">{statsTotal}</strong> người chơi
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={statsPage === 1}
                    onClick={() => handleStatsPageChange(statsPage - 1)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                  >
                    Trang trước
                  </button>
                  <span className="text-[10px] text-white/60 bg-white/5 px-3 py-1.5 rounded-xl flex items-center">
                    Trang {statsPage} / {statsTotalPages}
                  </span>
                  <button
                    disabled={statsPage === statsTotalPages}
                    onClick={() => handleStatsPageChange(statsPage + 1)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminWheels() {
  const [activeTab, setActiveTab] = useState('wheel'); // 'wheel' | 'baucua'
  const [wheels, setWheels] = useState([]);
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prizesLoading, setPrizesLoading] = useState(false);

  // Modals state
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [wheelForm, setWheelForm] = useState({ id: '', name: '', price: '', description: '', isActive: true });

  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeForm, setPrizeForm] = useState({
    id: '',
    wheelId: '',
    name: '',
    description: '',
    winRate: '',
    stock: -1,
    color: '#3b82f6',
    isActive: true,
    isJackpot: false,
  });

  // Tải danh sách tất cả vòng quay
  const fetchWheels = async (selectFirst = true) => {
    setLoading(true);
    try {
      const res = await adminWheelAPI.getAllWheels();
      setWheels(res.data.data);
      
      if (selectFirst && res.data.data.length > 0) {
        handleSelectWheel(res.data.data[0]);
      }
    } catch (err) {
      toast.error('Không thể lấy danh sách vòng quay');
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách phần quà của 1 vòng quay
  const handleSelectWheel = async (wheel) => {
    setSelectedWheel(wheel);
    setPrizesLoading(true);
    try {
      const res = await adminWheelAPI.getWheelDetails(wheel._id);
      setPrizes(res.data.data.prizes);
    } catch (err) {
      toast.error('Không thể tải phần quà của vòng quay này');
    } finally {
      setPrizesLoading(false);
    }
  };

  useEffect(() => {
    fetchWheels(true);
  }, []);

  // ── XỬ LÝ CRUD VÒNG QUAY ──
  const openWheelModal = (wheel = null) => {
    if (wheel) {
      setWheelForm({
        id: wheel._id,
        name: wheel.name,
        price: wheel.price,
        description: wheel.description || '',
        isActive: wheel.isActive,
      });
    } else {
      setWheelForm({ id: '', name: '', price: '', description: '', isActive: true });
    }
    setShowWheelModal(true);
  };

  const handleWheelSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(wheelForm.price) < 0) {
      toast.error('Giá lượt quay không được nhỏ hơn 0');
      return;
    }

    try {
      if (wheelForm.id) {
        await adminWheelAPI.updateWheel(wheelForm.id, wheelForm);
        toast.success('Cập nhật vòng quay thành công');
      } else {
        await adminWheelAPI.createWheel(wheelForm);
        toast.success('Tạo vòng quay thành công');
      }
      setShowWheelModal(false);
      fetchWheels(false);
      // Refresh selected
      if (selectedWheel?._id === wheelForm.id) {
        setSelectedWheel({ ...selectedWheel, ...wheelForm });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteWheel = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA vòng quay "${name}"? Hành động này sẽ xóa sạch toàn bộ phần quà thuộc vòng quay!`)) return;

    try {
      await adminWheelAPI.deleteWheel(id);
      toast.success('Đã xóa vòng quay thành công');
      setSelectedWheel(null);
      setPrizes([]);
      fetchWheels(true);
    } catch (err) {
      toast.error('Không thể xóa vòng quay');
    }
  };

  // ── XỬ LÝ CRUD PHẦN QUÀ ──
  const openPrizeModal = (prize = null) => {
    if (!selectedWheel) {
      toast.warn('Vui lòng chọn hoặc tạo vòng quay trước!');
      return;
    }

    if (prize) {
      setPrizeForm({
        id: prize._id,
        wheelId: selectedWheel._id,
        name: prize.name,
        description: prize.description || '',
        winRate: prize.winRate,
        stock: prize.stock,
        color: prize.color || '#3b82f6',
        isActive: prize.isActive,
        isJackpot: prize.isJackpot,
      });
    } else {
      setPrizeForm({
        id: '',
        wheelId: selectedWheel._id,
        name: '',
        description: '',
        winRate: '',
        stock: -1,
        color: '#3b82f6',
        isActive: true,
        isJackpot: false,
      });
    }
    setShowPrizeModal(true);
  };

  const handlePrizeSubmit = async (e) => {
    e.preventDefault();
    const rate = parseFloat(prizeForm.winRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Tỷ lệ trúng phải nằm trong khoảng 0 - 100%');
      return;
    }

    try {
      if (prizeForm.id) {
        await adminWheelAPI.updatePrize(prizeForm.id, prizeForm);
        toast.success('Cập nhật phần quà thành công');
      } else {
        await adminWheelAPI.createPrize(prizeForm);
        toast.success('Tạo phần quà thành công');
      }
      setShowPrizeModal(false);
      handleSelectWheel(selectedWheel);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeletePrize = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phần quà "${name}"?`)) return;

    try {
      await adminWheelAPI.deletePrize(id);
      toast.success('Đã xóa phần quà thành công');
      handleSelectWheel(selectedWheel);
    } catch (err) {
      toast.error('Không thể xóa phần quà');
    }
  };

  // Tính tổng tỷ lệ để đối soát trực quan cho Admin
  const totalRate = prizes.reduce((sum, p) => sum + (p.winRate || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER + TABS */}
      <div>
        <h1 className="text-2xl font-bold text-white">Quản Lý Games & Vòng Quay</h1>
        <p className="text-white/40 text-sm mt-1">Quản lý Vòng Quay May Mắn và các phòng Bầu Cua Tôm Cá real-time</p>

        {/* TAB BAR */}
        <div className="flex gap-2 mt-4 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'wheel'
                ? 'bg-primary-500/15 border border-primary-500/30 text-primary-400'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            🎡 Vòng Quay May Mắn
          </button>
          <button
            onClick={() => setActiveTab('baucua')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'baucua'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            🎲 Bầu Cua Tôm Cá
          </button>
        </div>
      </div>

      {/* BẦU CUA PANEL */}
      {activeTab === 'baucua' && <BauCuaRoomsPanel />}

      {/* WHEEL PANEL */}
      {activeTab === 'wheel' && (
        <>
          {/* Nút Tạo Vòng Quay */}
          <div className="flex justify-end">
            <button
              onClick={() => openWheelModal(null)}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 hover:shadow-glow-primary"
            >
              <FiPlusCircle /> Tạo Vòng Quay Mới
            </button>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: DANH SÁCH VÒNG QUAY */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2 flex items-center gap-1.5">
            <FiLayers /> Danh sách vòng quay
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : wheels.length === 0 ? (
            <div className="glass-card p-6 text-center text-white/30 text-xs">
              Chưa có vòng quay nào. Nhấp nút Tạo ở góc trên để bắt đầu!
            </div>
          ) : (
            <div className="space-y-3">
              {wheels.map((w) => (
                <div
                  key={w._id}
                  onClick={() => handleSelectWheel(w)}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col gap-2 cursor-pointer group ${
                    selectedWheel?._id === w._id
                      ? 'bg-primary-500/10 border-primary-500/35 shadow-glow-primary/10'
                      : 'bg-white/5 border-white/5 hover:bg-white/8'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-black text-white">{w.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20">
                        {w.price.toLocaleString()}đ
                      </span>
                      <span className={`w-2 h-2 rounded-full ${w.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed font-normal">{w.description}</p>
                  
                  {/* Nút hành động */}
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openWheelModal(w); }}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/70 hover:text-white"
                      title="Sửa vòng quay"
                    >
                      <FiEdit2 className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteWheel(w._id, w.name); }}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                      title="Xóa vòng quay"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: QUẢN LÝ PHẦN THƯỞNG CỦA VÒNG QUAY ĐANG CHỌN */}
        <div className="lg:col-span-8 space-y-4">
          {selectedWheel ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                  <FiAward /> Cấu hình phần quà vòng: <span className="text-white font-extrabold text-xs">"{selectedWheel.name}"</span>
                </h2>
                <button
                  onClick={() => openPrizeModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-primary-500/30 text-primary-400 bg-primary-500/15 hover:bg-primary-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-primary/10"
                >
                  <FiPlusCircle /> Thêm quà mới
                </button>
              </div>

              {/* BẢNG ĐỐI SOÁT TỔNG TỶ LỆ (%) RA QUÀ QUAN TRỌNG */}
              <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4" style={{ borderLeftColor: totalRate === 100 ? '#10b981' : '#f59e0b' }}>
                <div className="flex gap-3 items-start">
                  {totalRate === 100 ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 flex-shrink-0">
                      <FiCheck className="text-lg" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 flex-shrink-0">
                      <FiAlertTriangle className="text-lg animate-pulse" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-white">Tổng tỷ lệ thiết lập hiện tại: <span className={totalRate === 100 ? 'text-green-400 text-sm font-black' : 'text-yellow-500 text-sm font-black'}>{totalRate}%</span></h3>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {totalRate === 100
                        ? 'Tổng tỷ lệ hoàn hảo 100%! Việc phân bổ quà đảm bảo trực quan nhất.'
                        : 'Không bắt buộc phải bằng 100%. Thuật toán Weighted Backend sẽ tự quy đổi chính xác theo tỉ lệ trọng số, tuy nhiên nên chỉnh về 100% để quản lý tốt hơn.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* BẢNG DANH SÁCH QUÀ */}
              <div className="glass-card p-6">
                {prizesLoading ? (
                  <div className="space-y-3 py-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="skeleton h-12 w-full rounded-xl" />
                    ))}
                  </div>
                ) : prizes.length === 0 ? (
                  <div className="text-center py-10 text-white/30 text-xs">
                    Vòng quay này chưa được thêm phần quà nào. Hãy nhấp Thêm quà mới để tạo cơ cấu giải!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-white/40 border-b border-white/5 uppercase tracking-wider font-bold">
                          <th className="py-3 px-2">Quà</th>
                          <th className="py-3 px-2 text-center">Màu sắc</th>
                          <th className="py-3 px-2 text-right">Tỷ Lệ (%)</th>
                          <th className="py-3 px-2 text-right">Tồn Kho</th>
                          <th className="py-3 px-2 text-center">Trạng Thái</th>
                          <th className="py-3 px-2 text-center">Giải Lớn</th>
                          <th className="py-3 px-2 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {prizes.map((p) => (
                          <tr key={p._id} className="text-white/70 hover:bg-white/5 transition-colors">
                            
                            {/* Tên & mô tả */}
                            <td className="py-3 px-2">
                              <p className="text-white font-bold text-xs">{p.name}</p>
                              <p className="text-[10px] text-white/30 truncate max-w-[150px]">{p.description || 'Không có mô tả'}</p>
                            </td>

                            {/* Màu trên vòng quay */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.color }} />
                                <span className="font-mono text-[10px] text-white/40">{p.color}</span>
                              </div>
                            </td>

                            {/* Tỷ lệ % */}
                            <td className="py-3 px-2 text-right font-black text-white font-mono text-sm">
                              {p.winRate}%
                            </td>

                            {/* Stock kho */}
                            <td className="py-3 px-2 text-right font-semibold text-white/80">
                              {p.stock === -1 ? (
                                <span className="text-white/30 font-bold">Vô hạn</span>
                              ) : p.stock === 0 ? (
                                <span className="text-red-400 font-extrabold bg-red-500/10 px-1.5 py-0.5 rounded">Hết hàng</span>
                              ) : (
                                <span className="text-green-400 font-bold">{p.stock} cái</span>
                              )}
                            </td>

                            {/* Trạng thái hoạt động */}
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                                p.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30'
                              }`}>
                                {p.isActive ? 'Bật' : 'Tắt'}
                              </span>
                            </td>

                            {/* Jackpot */}
                            <td className="py-3 px-2 text-center">
                              {p.isJackpot ? (
                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-pink-500/20 text-pink-500 border border-pink-500/30">
                                  Jackpot 💎
                                </span>
                              ) : (
                                <span className="text-white/20">—</span>
                              )}
                            </td>

                            {/* Hành động */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openPrizeModal(p)}
                                  className="p-1 text-primary-400 hover:text-primary-300"
                                  title="Chỉnh sửa quà & tỷ lệ trúng"
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  onClick={() => handleDeletePrize(p._id, p.name)}
                                  className="p-1 text-red-400 hover:text-red-300"
                                  title="Xóa phần quà"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center text-white/40 text-sm">
              <FiSettings className="text-4xl mx-auto mb-4 text-white/10 animate-spin-slow" />
              Vui lòng chọn một Vòng quay ở danh sách bên trái để cấu hình chi tiết phần quà!
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL: THÊM/SỬA VÒNG QUAY ── */}
      {showWheelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWheelModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <FiSettings className="text-primary-400" /> {wheelForm.id ? 'Cập Nhật Vòng Quay' : 'Tạo Vòng Quay Mới'}
            </h2>
            
            <form onSubmit={handleWheelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Tên vòng quay</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vòng Quay Sinh Viên, Vòng Quay VIP"
                  value={wheelForm.name}
                  onChange={(e) => setWheelForm({ ...wheelForm, name: e.target.value })}
                  className="input-field text-xs py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Giá lượt quay (VNĐ)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="Ví dụ: 10000"
                    value={wheelForm.price}
                    onChange={(e) => setWheelForm({ ...wheelForm, price: e.target.value })}
                    className="input-field text-xs py-2 pr-12 font-bold"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-bold">VNĐ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Mô tả vòng quay</label>
                <textarea
                  placeholder="Giới thiệu chung về gói và cơ cấu phần quà..."
                  value={wheelForm.description}
                  onChange={(e) => setWheelForm({ ...wheelForm, description: e.target.value })}
                  className="input-field text-xs py-2 h-20"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="wheel-isActive"
                  checked={wheelForm.isActive}
                  onChange={(e) => setWheelForm({ ...wheelForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-dark-900 text-primary-500"
                />
                <label htmlFor="wheel-isActive" className="text-xs font-semibold text-white/70 cursor-pointer">Bật trạng thái hoạt động</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowWheelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-white/60 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  {wheelForm.id ? 'Lưu Thay Đổi' : 'Tạo Vòng Quay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: THÊM/SỬA PHẦN QUÀ (CÓ CHỈNH TỶ LỆ TRÚNG) ── */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrizeModal(false)} />
          <div className="relative glass-card p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <FiAward className="text-primary-400" /> {prizeForm.id ? 'Chỉnh Sửa Phần Quà' : 'Thêm Phần Quà Mới'}
            </h2>
            
            <form onSubmit={handlePrizeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tên quà */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-white/60 mb-2">Tên phần quà</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: +20.000đ, VPS Pro 1 Tháng, Hộp Quà Bí Ẩn"
                    value={prizeForm.name}
                    onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                    className="input-field text-xs py-2"
                    required
                  />
                </div>

                {/* TỶ LỆ TRÚNG % QUAN TRỌNG */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-2 flex items-center gap-1">
                    <FiPercent className="text-primary-400" /> Tỷ lệ trúng (%)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    placeholder="Ví dụ: 12.5"
                    value={prizeForm.winRate}
                    onChange={(e) => setPrizeForm({ ...prizeForm, winRate: e.target.value })}
                    className="input-field text-xs py-2 font-mono font-black"
                    required
                  />
                </div>

                {/* Tồn kho stock */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-2">Tồn kho (-1: vô hạn)</label>
                  <input
                    type="number"
                    min="-1"
                    placeholder="Ví dụ: 10, -1"
                    value={prizeForm.stock}
                    onChange={(e) => setPrizeForm({ ...prizeForm, stock: e.target.value })}
                    className="input-field text-xs py-2 font-mono"
                    required
                  />
                </div>

                {/* Chọn màu sắc hiển thị */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-2">Màu hiển thị vòng quay</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={prizeForm.color}
                      onChange={(e) => setPrizeForm({ ...prizeForm, color: e.target.value })}
                      className="w-10 h-10 p-0 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={prizeForm.color}
                      onChange={(e) => setPrizeForm({ ...prizeForm, color: e.target.value })}
                      className="input-field text-xs py-2 font-mono w-20 text-center"
                      required
                    />
                  </div>
                </div>

                {/* Cờ Giải Đặc Biệt (Jackpot) */}
                <div className="flex flex-col justify-center pl-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="prize-isJackpot"
                      checked={prizeForm.isJackpot}
                      onChange={(e) => setPrizeForm({ ...prizeForm, isJackpot: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-dark-900 text-primary-500"
                    />
                    <label htmlFor="prize-isJackpot" className="text-xs font-bold text-pink-500 cursor-pointer">Cờ Jackpot 💎</label>
                  </div>
                  <span className="text-[9px] text-white/30 leading-normal">Kích hoạt thông báo Realtime toàn site khi trúng giải này.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Mô tả chi tiết giải thưởng</label>
                <textarea
                  placeholder="Cách thức trao thưởng, mã coupon, hoặc lời chúc..."
                  value={prizeForm.description}
                  onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                  className="input-field text-xs py-2 h-16"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="prize-isActive"
                  checked={prizeForm.isActive}
                  onChange={(e) => setPrizeForm({ ...prizeForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-dark-900 text-primary-500"
                />
                <label htmlFor="prize-isActive" className="text-xs font-semibold text-white/70 cursor-pointer">Bật hoạt động</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPrizeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-white/60 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  {prizeForm.id ? 'Lưu quà' : 'Thêm quà'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
}
