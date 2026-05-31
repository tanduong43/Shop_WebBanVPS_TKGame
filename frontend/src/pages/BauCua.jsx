// src/pages/BauCua.jsx - Game Bầu Cua Tôm Cá Real-time
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { bauCuaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiClock, FiUsers, FiZap, FiLock, FiAlertTriangle, FiVolume2, FiVolumeX } from 'react-icons/fi';

import shakeSoundPath from '../assets/audio/shake.mp3';
import winSoundPath from '../assets/audio/win.mp3';
import betSoundPath from '../assets/audio/bet.mp3';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ─── DỮEỮ LIỆU BIỂU TƯỢNG ─────────────────────────────────────────────────
const SYMBOLS = [
  { key: 'bau', label: 'Bầu', emoji: '🎃', color: 'from-green-600 to-green-500', border: 'border-green-500/40', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
  { key: 'cua', label: 'Cua', emoji: '🦀', color: 'from-red-600 to-red-500', border: 'border-red-500/40', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
  { key: 'tom', label: 'Tôm', emoji: '🦐', color: 'from-pink-600 to-pink-500', border: 'border-pink-500/40', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]' },
  { key: 'ca', label: 'Cá', emoji: '🐟', color: 'from-blue-600 to-blue-500', border: 'border-blue-500/40', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  { key: 'ga', label: 'Gà', emoji: '🐓', color: 'from-yellow-600 to-yellow-500', border: 'border-yellow-500/40', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]' },
  { key: 'nai', label: 'Nai', emoji: '🦌', color: 'from-amber-600 to-amber-500', border: 'border-amber-500/40', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
];
const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map(s => [s.key, s]));

// ─── COMPONENT XÚC XẮC ───────────────────────────────────────────────────────
function DiceDisplay({ symbol, rolling, revealed }) {
  const s = symbol ? SYMBOL_MAP[symbol] : null;
  return (
    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center transition-all duration-500
      ${rolling ? `animate-shake-dice border-white/30 bg-white/5` : ''}
      ${revealed && s ? `${s.border} bg-gradient-to-br ${s.color}/10 ${s.glow}` : 'border-white/10 bg-white/5'}
    `}>
      {rolling ? (
        <span className="text-4xl animate-spin-slow select-none">🎲</span>
      ) : revealed && s ? (
        <span className="text-4xl sm:text-5xl select-none animate-bounce-in">{s.emoji}</span>
      ) : (
        <span className="text-3xl opacity-30 select-none">🎲</span>
      )}
    </div>
  );
}

// ─── COMPONENT CÁI TÔ ────────────────────────────────────────────────────────
function BowlOverlay({ status }) {
  // Trạng thái: 'waiting', 'locked', 'rolling', 'finished'
  const [animClass, setAnimClass] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === 'finished') {
      // Mở tô
      setAnimClass('animate-bowl-uncover');
      const t = setTimeout(() => setIsVisible(false), 600); // Ẩn hẳn sau khi bay lên
      return () => clearTimeout(t);
    } else {
      // Úp tô (nếu đang hidden thì hiển thị)
      setIsVisible(true);
      setAnimClass('animate-bowl-cover');
    }
  }, [status]);

  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none ${animClass}`}>
      <div className="w-56 h-56 sm:w-64 sm:h-64 relative drop-shadow-2xl">
        {/* Hình dáng cái tô úp ngược */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-900 rounded-full border-b-[12px] border-amber-950 shadow-[inset_0_-20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
          {/* Họa tiết rồng/mây mờ */}
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+')] opacity-50" />
        </div>
        {/* Đáy tô (ở trên cùng vì úp) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-950 rounded-full border-b-8 border-amber-900 scale-y-50 -translate-y-8" />
        {/* Hiệu ứng rung khi đang lắc */}
        {status === 'rolling' && (
          <div className="absolute inset-0 animate-shake-dice flex items-center justify-center">
            {/* Tạo âm thanh lách cách ảo bằng animation */}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENT COUNTDOWN ─────────────────────────────────────────────────────
function CountdownBar({ endsAt, status }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const totalSeconds = 15;

  useEffect(() => {
    if (!endsAt || status !== 'waiting') return;
    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(endsAt) - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [endsAt, status]);

  const pct = status === 'waiting' ? (secondsLeft / totalSeconds) * 100 : 0;
  const urgent = secondsLeft <= 5 && status === 'waiting';

  if (status === 'locked' || status === 'rolling') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-yellow-400">
        <FiLock className="animate-pulse" />
        {status === 'locked' ? 'Đã khóa cược – Đang xóc...' : '🎲 Đang lắc...'}
      </div>
    );
  }
  if (status === 'finished') return null;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/40 flex items-center gap-1"><FiClock /> Thời gian đặt cược</span>
        <span className={`font-black text-base font-mono ${urgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {secondsLeft}s
        </span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${urgent ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── BAUCUA MAIN PAGE ─────────────────────────────────────────────────────────
export default function BauCua() {
  const { roomId } = useParams();
  const { user, isAuthenticated, updateBalance } = useAuth();

  const [room, setRoom] = useState(null);
  const [roundState, setRoundState] = useState(null); // { status, roundNumber, waitingEndsAt, bets }
  const [diceResult, setDiceResult] = useState([null, null, null]);
  const [rolling, setRolling] = useState(false);
  const [myBets, setMyBets] = useState({}); // { symbol: amount }
  const [betAmount, setBetAmount] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [betLoading, setBetLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Kết quả popup
  const [resultPopup, setResultPopup] = useState(null); // { result, myProfit, myBets }

  const socketRef = useRef(null);
  const token = localStorage.getItem('token');

  // ── KẾT NỐI SOCKET ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = socketIO(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('baucua:join_room', roomId);
    });

    // Trạng thái phòng (ban đầu hoặc refresh)
    socket.on('baucua:room_state', (data) => {
      setRoundState({
        status: data.status,
        roundId: data.roundId,
        roundNumber: data.roundNumber,
        waitingEndsAt: data.waitingEndsAt,
        bets: data.bets || [],
      });
      setDiceResult([null, null, null]);
      setRolling(false);
      setMyBets({});
    });

    // Ai đó đặt cược
    socket.on('baucua:bet_placed', ({ bet }) => {
      setRoundState(prev => prev ? { ...prev, bets: [...(prev.bets || []), bet] } : prev);
    });

    // Đã khóa cược
    socket.on('baucua:round_locked', ({ roundId }) => {
      setRoundState(prev => prev ? { ...prev, status: 'locked' } : prev);
    });

    // Đang lắc
    socket.on('baucua:rolling', ({ duration }) => {
      setRolling(true);
      setRoundState(prev => prev ? { ...prev, status: 'rolling' } : prev);
      if (soundEnabledRef.current) {
        new Audio(shakeSoundPath).play().catch(e => console.warn(e));
      }
    });

    // Kết quả
    socket.on('baucua:result', (data) => {
      setRolling(false);
      setDiceResult(data.result);
      setRoundState(prev => prev ? { ...prev, status: 'finished', bets: data.bets } : prev);

      // Tính lợi nhuận cá nhân
      if (user) {
        const myBetsList = (data.bets || []).filter(b => b.userId === user._id && !b.isBot);
        const totalProfit = myBetsList.reduce((s, b) => s + (b.profit || 0), 0);
        if (myBetsList.length > 0) {
          setResultPopup({ result: data.result, myProfit: totalProfit, myBets: myBetsList });
          if (totalProfit > 0) {
            if (soundEnabledRef.current) {
              new Audio(winSoundPath).play().catch(e => console.warn(e));
            }
            toast.success(`🎉 Thắng +${totalProfit.toLocaleString()}đ!`, { autoClose: 4000 });
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
          } else if (totalProfit < 0) {
            toast.error(`Thua ${Math.abs(totalProfit).toLocaleString()}đ. Cố lên!`, { autoClose: 3000 });
          }
        }
        // Cập nhật balance nếu server gửi
        const newBal = data.userBalances?.[user._id];
        if (newBal !== undefined && updateBalance) updateBalance(newBal);
      }

      // Load history
      loadHistory();
    });

    // Balance cập nhật
    socket.on('balance:updated', ({ balance }) => {
      if (updateBalance) updateBalance(balance);
    });

    // Phòng mới/ván mới sắp bắt đầu → reset
    socket.on('baucua:room_state', (data) => {
      setResultPopup(null);
      setMyBets({});
    });

    return () => {
      socket.emit('baucua:leave_room', roomId);
      socket.disconnect();
    };
  }, [roomId, token, user]);

  // ── TẢI DỮ LIỆU BAN ĐẦU ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await bauCuaAPI.getRoomState(roomId);
        setRoom(res.data.data.room);
        const round = res.data.data.currentRound;
        if (round) {
          setRoundState({
            status: round.status,
            roundId: round._id,
            roundNumber: round.roundNumber,
            waitingEndsAt: round.waitingEndsAt,
            bets: round.bets || [],
          });
          if (round.status === 'finished') {
            setDiceResult(round.result || [null, null, null]);
          }
        }
      } catch (err) {
        toast.error('Không thể tải thông tin phòng');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
    loadHistory();
  }, [roomId]);

  const loadHistory = async () => {
    try {
      const res = await bauCuaAPI.getRoomHistory(roomId, { limit: 15 });
      setHistory(res.data.data);
    } catch { }
  };

  // ── ĐẶT CƯỢC ─────────────────────────────────────────────────────────────
  const handleBet = async (symbolKey) => {
    if (!isAuthenticated) { toast.warn('Đăng nhập để đặt cược!'); return; }
    if (roundState?.status !== 'waiting') { toast.warn('Không trong thời gian đặt cược!'); return; }
    if (betAmount < (room?.minBet || 1000)) { toast.warn(`Cược tối thiểu ${(room?.minBet || 1000).toLocaleString()}đ`); return; }
    if (betAmount > (room?.maxBet || 500000)) { toast.warn(`Cược tối đa ${(room?.maxBet || 500000).toLocaleString()}đ`); return; }

    setBetLoading(true);
    try {
      await bauCuaAPI.placeBet(roomId, { symbol: symbolKey, amount: betAmount });
      if (soundEnabled) {
        new Audio(betSoundPath).play().catch(e => console.warn(e));
      }
      setMyBets(prev => ({ ...prev, [symbolKey]: (prev[symbolKey] || 0) + betAmount }));
      toast.success(`Cược ${betAmount.toLocaleString()}đ vào ${SYMBOL_MAP[symbolKey].label}!`, { autoClose: 1500 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt cược thất bại');
    } finally {
      setBetLoading(false);
    }
  };

  // Tổng cược trong ván theo từng ô
  const totalBetsBySymbol = roundState?.bets?.reduce((acc, b) => {
    acc[b.symbol] = (acc[b.symbol] || 0) + b.amount;
    return acc;
  }, {}) || {};

  const totalPlayers = [...new Set((roundState?.bets || []).filter(b => !b.isBot).map(b => b.userId?.toString()))].length;
  const totalVolume = (roundState?.bets || []).reduce((s, b) => s + b.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce-in">🎲</div>
          <p className="text-white/50 text-sm">Đang tải phòng chơi...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <FiAlertTriangle className="text-4xl text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold mb-4">Phòng không tồn tại hoặc đã đóng cửa</p>
          <Link to="/games" className="btn-primary text-sm px-5 py-2">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container max-w-5xl">

        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/games" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
            <FiArrowLeft /> Trở về
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-black text-white">🎲 {room.name}</h1>
            <p className="text-[10px] text-white/30">Ván #{roundState?.roundNumber || '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/8 hover:bg-white/10 text-xs text-white/60 transition-colors"
            >
              {soundEnabled ? <FiVolume2 className="text-green-400" /> : <FiVolumeX className="text-white/40" />}
              {soundEnabled ? 'Bật âm thanh' : 'Tắt âm thanh'}
            </button>
            <div className="flex items-center gap-1 text-xs text-white/40">
              <FiUsers /> {totalPlayers} người
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] text-red-400 font-bold">LIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* CỘT TRÁI: THÔNG TIN VÁN + COUNTDOWN */}
          <div className="lg:col-span-3 space-y-4">

            {/* Countdown */}
            <div className="glass-card p-4">
              <CountdownBar endsAt={roundState?.waitingEndsAt} status={roundState?.status} />
            </div>

            {/* Tổng cược */}
            <div className="glass-card p-4 space-y-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Tổng bàn</p>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Tổng tiền cược</span>
                <span className="font-bold text-amber-400">{totalVolume.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Người chơi</span>
                <span className="font-bold text-white">{totalPlayers}</span>
              </div>
            </div>

            {/* Phạm vi cược */}
            <div className="glass-card p-4 space-y-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Phòng</p>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Cược tối thiểu</span>
                <span className="font-bold text-green-400">{room.minBet.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Cược tối đa</span>
                <span className="font-bold text-red-400">{room.maxBet.toLocaleString()}đ</span>
              </div>
            </div>

            {/* Lịch sử ván */}
            <div className="glass-card p-4 space-y-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Kết quả gần đây</p>
              {history.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-2">Chưa có kết quả</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {history.slice(0, 10).map(h => (
                    <div key={h._id} className="flex items-center justify-between text-[10px]">
                      <span className="text-white/30">#{h.roundNumber}</span>
                      <div className="flex gap-0.5">
                        {(h.result || []).map((r, i) => (
                          <span key={i} className="text-base">{SYMBOL_MAP[r]?.emoji || '?'}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CỘT GIỮA: ĐĨA XÓC + BÀN CƯỢC */}
          <div className="lg:col-span-6 space-y-5">

            {/* 3 xúc xắc & Cái tô */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-center gap-4 py-8">
                {[0, 1, 2].map(i => (
                  <DiceDisplay
                    key={i}
                    symbol={diceResult[i]}
                    rolling={rolling}
                    revealed={!rolling && diceResult[i] !== null}
                  />
                ))}
              </div>

              {/* Lớp overlay cái tô */}
              {roundState && (
                <BowlOverlay status={roundState.status} />
              )}

              {/* Kết quả popup */}
              {resultPopup && !rolling && (
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/8 text-center animate-scale-in">
                  {resultPopup.myProfit > 0 ? (
                    <p className="text-green-400 font-black text-lg">
                      🎉 Thắng <span className="font-mono">+{resultPopup.myProfit.toLocaleString()}đ</span>
                    </p>
                  ) : resultPopup.myProfit < 0 ? (
                    <p className="text-red-400 font-bold">
                      😔 Thua {Math.abs(resultPopup.myProfit).toLocaleString()}đ
                    </p>
                  ) : (
                    <p className="text-white/50 font-bold">Hòa vốn</p>
                  )}
                </div>
              )}
            </div>

            {/* CHỌN MỨC CƯỢC */}
            <div className="glass-card p-4 space-y-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Chọn mức cược</p>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    disabled={amt < room.minBet || amt > room.maxBet}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${betAmount === amt
                      ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : amt < room.minBet || amt > room.maxBet
                        ? 'opacity-20 cursor-not-allowed border-white/5 text-white/30'
                        : 'bg-white/5 border-white/8 text-white/70 hover:bg-white/10'
                      }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={room.minBet}
                  max={room.maxBet}
                  step={1000}
                  value={betAmount}
                  onChange={e => setBetAmount(Math.max(room.minBet, Math.min(room.maxBet, parseInt(e.target.value) || room.minBet)))}
                  className="input-field text-xs py-2 font-mono font-bold flex-1"
                />
                <span className="text-[10px] text-white/40">đ</span>
              </div>
            </div>

            {/* BÀN CƯỢC 6 Ô */}
            <div className="glass-card p-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Bàn cược</p>
              <div className="grid grid-cols-3 gap-2">
                {SYMBOLS.map(sym => {
                  const symResult = !rolling && diceResult[0] !== null;
                  const appearances = symResult ? diceResult.filter(r => r === sym.key).length : 0;
                  const isWinner = symResult && appearances > 0;
                  const myBetAmt = myBets[sym.key] || 0;
                  const tableBetAmt = totalBetsBySymbol[sym.key] || 0;
                  const canBet = roundState?.status === 'waiting' && isAuthenticated;

                  return (
                    <button
                      key={sym.key}
                      onClick={() => canBet && handleBet(sym.key)}
                      disabled={!canBet || betLoading}
                      className={`relative p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all duration-300 overflow-hidden
                        ${isWinner ? `${sym.border} ${sym.glow} bg-gradient-to-br ${sym.color}/15 scale-105` : ''}
                        ${canBet ? `${sym.border} bg-gradient-to-br ${sym.color}/5 hover:bg-gradient-to-br hover:${sym.color}/15 hover:scale-105 hover:${sym.glow} active:scale-95 cursor-pointer` : 'border-white/8 opacity-60 cursor-default'}
                        ${myBetAmt > 0 ? 'ring-2 ring-amber-400/50' : ''}
                      `}
                    >
                      {isWinner && appearances > 0 && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                          x{appearances}
                        </div>
                      )}
                      <span className="text-3xl">{sym.emoji}</span>
                      <span className="text-[11px] font-bold text-white">{sym.label}</span>
                      {tableBetAmt > 0 && (
                        <span className="text-[9px] text-white/50">{tableBetAmt.toLocaleString()}đ</span>
                      )}
                      {myBetAmt > 0 && (
                        <span className="text-[9px] font-bold text-amber-400">
                          Của tôi: {myBetAmt.toLocaleString()}đ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!isAuthenticated && (
                <Link to="/login" className="block mt-3 text-center text-xs text-primary-400 hover:text-primary-300">
                  Đăng nhập để đặt cược
                </Link>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH CƯỢC */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1">
                <FiZap /> Lệnh cược ván này
              </p>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {(roundState?.bets || []).length === 0 ? (
                  <p className="text-[10px] text-white/20 text-center py-4">Chưa có lệnh cược</p>
                ) : (
                  [...(roundState?.bets || [])].reverse().map((b, i) => {
                    const sym = SYMBOL_MAP[b.symbol];
                    const isMe = b.userId === user?._id;
                    return (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-[11px] transition-all
                        ${isMe ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/3'}`}>
                        <span className="text-base">{sym?.emoji || '?'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${b.isBot ? 'text-white/30' : isMe ? 'text-amber-400' : 'text-white/70'}`}>
                            {b.isBot ? `🤖 ${b.username}` : isMe ? '⭐ Bạn' : b.username}
                          </p>
                          <p className="text-white/30">{sym?.label}</p>
                        </div>
                        <span className="font-mono font-bold text-white/60 text-right">
                          {b.amount.toLocaleString()}đ
                          {b.profit !== undefined && b.profit !== 0 && (
                            <span className={`block text-[9px] ${b.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {b.profit > 0 ? '+' : ''}{b.profit.toLocaleString()}đ
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
