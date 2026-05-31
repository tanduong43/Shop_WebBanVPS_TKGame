// src/pages/Games.jsx - Trung Tâm Trò Chơi
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bauCuaAPI, wheelAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FiZap, FiUsers, FiLock, FiChevronRight, FiPlayCircle,
  FiDollarSign, FiActivity,
} from 'react-icons/fi';

// Biểu tượng Bầu Cua
const SYMBOL_EMOJI = { bau: '🎃', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐓', nai: '🦌' };
const SYMBOL_LABEL = { bau: 'Bầu', cua: 'Cua', tom: 'Tôm', ca: 'Cá', ga: 'Gà', nai: 'Nai' };

function BauCuaRoomCard({ room }) {
  return (
    <Link
      to={`/games/bau-cua/${room._id}`}
      className="group relative overflow-hidden p-5 rounded-2xl border border-white/8 bg-gradient-to-br from-amber-500/5 to-orange-600/5 hover:border-amber-500/40 hover:from-amber-500/10 hover:to-orange-600/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col gap-3"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <div>
            <h3 className="text-sm font-black text-white">{room.name}</h3>
            <p className="text-[10px] text-white/40">{room.description || 'Phòng Bầu Cua Tôm Cá'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* Bet range */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/40">Cược</span>
        <span className="font-bold text-amber-400">
          {room.minBet.toLocaleString()}đ – {room.maxBet.toLocaleString()}đ
        </span>
      </div>

      {/* Symbols preview */}
      <div className="flex gap-1.5">
        {Object.entries(SYMBOL_EMOJI).map(([key, emoji]) => (
          <span key={key} title={SYMBOL_LABEL[key]}
            className="flex-1 text-center py-1 rounded-lg bg-white/5 hover:bg-white/10 text-base transition-all">
            {emoji}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="text-[10px] text-white/30">
          <FiActivity className="inline mr-1" />{room.totalRounds} ván đã chơi
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
          Vào phòng <FiChevronRight />
        </span>
      </div>
    </Link>
  );
}

function WheelCard({ wheel }) {
  return (
    <Link
      to={`/games/wheel/${wheel._id}`}
      className="group relative overflow-hidden p-5 rounded-2xl border border-white/8 bg-gradient-to-br from-primary-500/5 to-accent-500/5 hover:border-primary-500/40 hover:from-primary-500/10 hover:to-accent-500/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)] flex flex-col gap-3"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎡</span>
          <div>
            <h3 className="text-sm font-black text-white">{wheel.name}</h3>
            <p className="text-[10px] text-white/40 truncate max-w-[140px]">{wheel.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400 font-bold">OPEN</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/40">Chi phí mỗi lượt</span>
        <span className="font-bold text-primary-400">{wheel.price.toLocaleString()}đ</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-[10px] text-white/30">Nhiều phần quà hấp dẫn</span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-primary-400 group-hover:text-primary-300 transition-colors">
          Chơi ngay <FiChevronRight />
        </span>
      </div>
    </Link>
  );
}

export default function Games() {
  const { isAuthenticated } = useAuth();
  const [bauCuaRooms, setBauCuaRooms] = useState([]);
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roomsRes, wheelsRes] = await Promise.all([
          bauCuaAPI.getRooms(),
          wheelAPI.getAll(),
        ]);
        setBauCuaRooms(roomsRes.data.data);
        setWheels(wheelsRes.data.data);
      } catch (err) {
        console.error('Lỗi tải danh sách game:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container max-w-6xl animate-slide-up">

        {/* HERO HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/8 text-xs text-white/50 mb-4">
            <FiZap className="text-amber-400" /> TRUNG TÂM TRÒ CHƠI
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
            🎮 <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-primary-400 bg-clip-text text-transparent">Trò Chơi</span>
          </h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Thử vận may với Bầu Cua Tôm Cá và Vòng Quay May Mắn. Tính năng chơi vui vẻ vui lòng không nạp với bất kỳ hình thức
          </p>
          {!isAuthenticated && (
            <Link to="/login" className="inline-flex items-center gap-2 mt-4 btn-primary text-sm px-6 py-2.5">
              <FiLock /> Đăng nhập để chơi
            </Link>
          )}
        </div>

        {/* STATS BANNER */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: '🎲', label: 'Bầu Cua Live', value: `${bauCuaRooms.length} phòng`, color: 'text-amber-400' },
            { icon: '🎡', label: 'Vòng Quay', value: `${wheels.length} gói`, color: 'text-primary-400' },
            { icon: '⚡', label: 'Real-time', value: 'Socket.IO', color: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* BẦU CUA TÔM CÁ */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🎲</span>
                <div>
                  <h2 className="text-lg font-black text-white">Bầu Cua Tôm Cá</h2>
                  <p className="text-xs text-white/40">Real-time với thuật toán thông minh</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[9px] text-red-400 font-bold uppercase">Live</span>
                </div>
              </div>

              {bauCuaRooms.length === 0 ? (
                <div className="glass-card p-8 text-center text-white/30 text-sm">
                  Hiện chưa có phòng Bầu Cua nào đang hoạt động
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bauCuaRooms.map(room => <BauCuaRoomCard key={room._id} room={room} />)}
                </div>
              )}
            </section>

            {/* ĐỐ VUI SINH TỒN */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🧠</span>
                <div>
                  <h2 className="text-lg font-black text-white">Đố Vui Sinh Tồn</h2>
                  <p className="text-xs text-white/40">Battle Royale trắc nghiệm — Tự tạo phòng, 2-10 người</p>
                </div>
              </div>

              <Link
                to="/games/trivia"
                className="group relative overflow-hidden p-6 rounded-2xl border border-white/8 bg-gradient-to-br from-emerald-500/5 to-cyan-600/5 hover:border-emerald-500/40 transition-all duration-300 flex flex-col sm:flex-row items-center gap-4"
              >
                <span className="text-4xl">⚔️</span>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-white font-black">Trivia Battle Royale</h3>
                  <p className="text-white/40 text-sm mt-1">
                    100 HP · 10 câu · Top 1 nhanh nhất được khiên · Sai trừ 15 HP
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
                  {isAuthenticated ? 'Chơi ngay' : 'Đăng nhập để chơi'} <FiChevronRight />
                </span>
              </Link>
            </section>

            {/* VÒNG QUAY MAY MẮN */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🎡</span>
                <div>
                  <h2 className="text-lg font-black text-white">Vòng Quay May Mắn</h2>
                  <p className="text-xs text-white/40">Quay thưởng, trúng phần quà hấp dẫn</p>
                </div>
              </div>

              {wheels.length === 0 ? (
                <div className="glass-card p-8 text-center text-white/30 text-sm">
                  Hiện chưa có vòng quay nào đang hoạt động
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wheels.map(w => <WheelCard key={w._id} wheel={w} />)}
                  {/* Link tới trang vòng quay đầy đủ */}
                  <Link
                    to="/wheels"
                    className="group p-5 rounded-2xl border border-dashed border-white/10 hover:border-primary-500/30 flex items-center justify-center gap-2 text-white/30 hover:text-primary-400 transition-all duration-300 text-sm font-medium"
                  >
                    <FiPlayCircle /> Xem tất cả vòng quay
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
