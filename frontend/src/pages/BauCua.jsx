// src/pages/BauCua.jsx - Game Bầu Cua Tôm Cá Real-time
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { bauCuaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiClock, FiZap, FiLock, FiAlertTriangle, FiVolume2, FiVolumeX } from 'react-icons/fi';

// Socket URL: ưu tiên VITE_SOCKET_URL, fallback lấy từ VITE_API_URL (bỏ /api), cuối cùng dùng localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : null)
  || 'http://localhost:5000';

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

const sameUserId = (a, b) => {
  if (a == null || b == null) return false;
  return String(a) === String(b);
};

// ─── COMPONENT XÚC XẮC (con trên dĩa) ───────────────────────────────────────
function DiceDisplay({ symbol, rolling, revealed }) {
  const s = symbol ? SYMBOL_MAP[symbol] : null;
  return (
    <div
      className={`relative w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] rounded-xl flex items-center justify-center transition-all duration-500
        shadow-[0_4px_0_rgba(0,0,0,0.35),0_8px_16px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,0.25)]
        ${rolling ? 'animate-shake-dice border-amber-200/40 bg-gradient-to-br from-amber-50 to-amber-100' : ''}
        ${!rolling && revealed && s
          ? `border-2 ${s.border} bg-gradient-to-br from-amber-50 via-white to-amber-100/90 ${s.glow} scale-105`
          : !rolling ? 'border-2 border-amber-200/50 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/80' : ''}
      `}
    >
      <div className="absolute inset-x-1 top-0.5 h-1/3 rounded-t-lg bg-white/40 pointer-events-none" />
      {rolling ? (
        <span className="text-3xl sm:text-4xl animate-spin-slow select-none drop-shadow-sm">🎲</span>
      ) : revealed && s ? (
        <span className="text-3xl sm:text-[2.35rem] select-none animate-bounce-in drop-shadow-md">{s.emoji}</span>
      ) : (
        <span className="text-2xl sm:text-3xl opacity-25 select-none">?</span>
      )}
    </div>
  );
}

// ─── DĨA (lớp dưới) ─────────────────────────────────────────────────────────
function ServingPlate() {
  return (
    <div className="relative w-[19rem] h-[7rem] sm:w-[22rem] sm:h-[8rem] mx-auto" aria-hidden>
      {/* Bóng đổ */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[92%] h-5 rounded-[100%] bg-black/45 blur-xl" />

      {/* Vành dĩa — nhìn nghiêng (ellipse) */}
      <div
        className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950
          border-[3px] border-amber-500/50 shadow-[0_10px_28px_rgba(0,0,0,0.5),inset_0_3px_10px_rgba(255,220,160,0.2)]"
      />

      {/* Mặt dĩa đỏ */}
      <div
        className="absolute left-[6%] right-[6%] top-[14%] bottom-[18%] rounded-[50%]
          bg-gradient-to-b from-red-700 via-red-900 to-red-950
          border border-red-600/30
          shadow-[inset_0_8px_20px_rgba(0,0,0,0.45),inset_0_-2px_8px_rgba(255,100,100,0.1)]"
      >
        <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_40%_28%,rgba(255,210,140,0.28),transparent_58%)]" />
        <div className="absolute inset-[12%] rounded-[50%] border border-amber-400/15 border-dashed" />
      </div>

      {/* Cạnh dĩa phía trước (độ sâu) */}
      <div className="absolute left-[4%] right-[4%] bottom-[6%] h-3 rounded-[50%] bg-gradient-to-b from-amber-900/80 to-amber-950 blur-[1px]" />
    </div>
  );
}

// ─── 3 CON + DĨA PHÍA DƯỚI ───────────────────────────────────────────────────
function DicePlateArea({ diceResult, rolling, status, children }) {
  const covered = !status || status !== 'finished';

  return (
    <div className="relative flex flex-col items-center justify-center py-5 sm:py-7 min-h-[240px] sm:min-h-[280px]">
      <div className="relative flex flex-col items-center">
        {/* 3 con — chỉ hiện khi mở nắp */}
        {!covered && (
          <div className="relative z-20 flex items-center justify-center gap-2 sm:gap-3 px-1 mb-[-2.25rem] sm:mb-[-2.75rem] animate-bounce-in">
            {[0, 1, 2].map(i => (
              <DiceDisplay
                key={i}
                symbol={diceResult[i]}
                rolling={rolling}
                revealed={!rolling && diceResult[i] !== null}
              />
            ))}
          </div>
        )}

        {/* Dĩa — luôn hiện */}
        <div className={`relative z-10 w-full flex justify-center ${covered ? 'pt-2' : 'pt-1'}`}>
          <ServingPlate />
        </div>
      </div>

      {children}
    </div>
  );
}

// ─── COMPONENT CÁI TÔ ────────────────────────────────────────────────────────
function BowlOverlay({ status, waitingEndsAt, rollingEndsAt }) {
  const [isVisible, setIsVisible] = useState(true);
  const [animClass, setAnimClass] = useState('animate-bowl-cover');
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (status === 'finished') {
      setAnimClass('animate-bowl-uncover');
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 600); // 0.6s animation duration
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
      setAnimClass('animate-bowl-cover');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'waiting' || status === 'rolling') {
      const targetTime = status === 'waiting' ? waitingEndsAt : rollingEndsAt;
      if (!targetTime) return;

      const tick = () => {
        const diff = Math.max(0, Math.ceil((new Date(targetTime) - Date.now()) / 1000));
        setSecondsLeft(diff);
      };
      tick();
      const interval = setInterval(tick, 500);
      return () => clearInterval(interval);
    }
  }, [status, waitingEndsAt, rollingEndsAt]);

  if (!isVisible) return null;

  const isShaking = status === 'rolling';

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none ${animClass}`}
    >
      <div className={`relative w-[19rem] h-[19rem] sm:w-[22rem] sm:h-[22rem] drop-shadow-[0_16px_40px_rgba(0,0,0,0.6)] ${isShaking ? 'animate-shake-dice' : ''}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-600 via-amber-800 to-amber-950 border-b-[10px] border-amber-950 shadow-[inset_0_-24px_48px_rgba(0,0,0,0.55),inset_0_4px_12px_rgba(255,220,160,0.12)] overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_30%,rgba(255,230,180,0.2),transparent_60%)]" />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-24 sm:h-24 bg-amber-950 rounded-full border-4 border-amber-900 scale-y-[0.45] -translate-y-6 sm:-translate-y-7 shadow-lg" />
        
        {/* Trạng thái WAITING (Đang đặt cược) */}
        {status === 'waiting' && secondsLeft > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white select-none">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
              Thời gian cược
            </span>
            <span className={`text-4xl sm:text-5xl font-black font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-1 ${secondsLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-white'}`}>
              {secondsLeft}s
            </span>
          </div>
        )}

        {/* Trạng thái LOCKED (Khóa cược) */}
        {status === 'locked' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white select-none">
            <span className="text-[11px] sm:text-sm font-bold text-yellow-400 uppercase tracking-widest animate-pulse drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
              Đã khóa cược
            </span>
            <span className="text-[10px] sm:text-xs text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5 animate-pulse">
              Đang chuẩn bị...
            </span>
          </div>
        )}

        {/* Trạng thái ROLLING (Đang lắc) */}
        {status === 'rolling' && secondsLeft > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white select-none">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400/90 uppercase tracking-widest animate-pulse drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
              Đang lắc...
            </span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-1">
              {secondsLeft}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Timings are centralized on the bowl/lid overlay.

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

  const shakeAudioRef = useRef(new Audio('/audio/shake.mp3'));
  const winAudioRef = useRef(new Audio('/audio/win.mp3'));
  const betAudioRef = useRef(new Audio('/audio/bet.mp3'));

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const unlockAudio = () => {
      // Play a short silence to unlock audio context
      shakeAudioRef.current.play().then(() => {
        shakeAudioRef.current.pause();
        shakeAudioRef.current.currentTime = 0;
      }).catch(() => {});

      winAudioRef.current.play().then(() => {
        winAudioRef.current.pause();
        winAudioRef.current.currentTime = 0;
      }).catch(() => {});

      betAudioRef.current.play().then(() => {
        betAudioRef.current.pause();
        betAudioRef.current.currentTime = 0;
      }).catch(() => {});

      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Admin selected mode override state
  const [currentAdminMode, setCurrentAdminMode] = useState('auto');

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Kết quả popup
  const [resultPopup, setResultPopup] = useState(null); // { result, myProfit, myBets }

  // Chat real-time states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit('baucua:send_chat', { roomId, message: chatInput });
      setChatInput('');
    }
  };

  // Admin override states
  const [adminOverrideSelection, setAdminOverrideSelection] = useState([]);

  const handleAdminSelect = (symbolKey) => {
    if (adminOverrideSelection.length >= 3) {
      toast.warn('Đã chọn đủ 3 hình. Vui lòng bấm "Xóa" để chọn lại.');
      return;
    }
    setAdminOverrideSelection(prev => [...prev, symbolKey]);
  };

  const handleAdminClear = () => {
    setAdminOverrideSelection([]);
  };

  const handleAdminSubmit = () => {
    if (adminOverrideSelection.length !== 3) {
      toast.warn('Vui lòng chọn đúng 3 hình!');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('baucua:admin_override', {
        roomId,
        result: adminOverrideSelection,
      });
    }
  };

  const handleAdminModeSubmit = (mode) => {
    if (socketRef.current) {
      socketRef.current.emit('baucua:admin_mode_override', {
        roomId,
        mode,
      });
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Đồng bộ myBets từ danh sách cược trong phòng (hỗ trợ lưu vết khi reload trang)
  useEffect(() => {
    if (user && roundState?.bets) {
      const myId = user._id ?? user.id;
      const myBetsMap = {};
      roundState.bets.forEach(b => {
        if (sameUserId(b.userId, myId) && !b.isBot) {
          myBetsMap[b.symbol] = (myBetsMap[b.symbol] || 0) + b.amount;
        }
      });
      const isDifferent = Object.keys(myBetsMap).length !== Object.keys(myBets).length ||
        Object.keys(myBetsMap).some(k => myBetsMap[k] !== myBets[k]);
      if (isDifferent) {
        setMyBets(myBetsMap);
      }
    }
  }, [user, roundState?.bets]);

  const socketRef = useRef(null);
  const userRef = useRef(user);
  const updateBalanceRef = useRef(updateBalance);
  const token = localStorage.getItem('token');

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    updateBalanceRef.current = updateBalance;
  }, [updateBalance]);

  const loadHistory = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await bauCuaAPI.getRoomHistory(roomId, { limit: 15 });
      setHistory(res.data.data);
    } catch {
      // Lịch sử không bắt buộc — bỏ qua nếu tải thất bại
    }
  }, [roomId]);

  // ── KẾT NỐI SOCKET ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = socketIO(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('baucua:join_room', roomId);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ BauCua socket disconnected:', reason);
      toast.warning('Mất kết nối game Bầu Cua. Đang tự động kết nối lại...', {
        toastId: 'baucua-disconnect',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('⚡ BauCua socket reconnected after', attemptNumber, 'attempts');
      toast.dismiss('baucua-disconnect');
      toast.success('Đã kết nối lại game Bầu Cua!', { autoClose: 3000 });
      socket.emit('baucua:join_room', roomId);
    });

    // Nhận tin nhắn chat
    socket.on('baucua:chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg].slice(-50));
    });

    // Admin override success/error events
    socket.on('baucua:override_success', ({ result }) => {
      const labels = result.map(k => SYMBOL_MAP[k]?.label || k).join(', ');
      toast.success(`🎛️ Thiết lập kết quả thành công: ${labels}`);
      setAdminOverrideSelection([]);
    });

    socket.on('baucua:mode_override_success', ({ mode }) => {
      const modeLabels = {
        auto: 'Tự động (Hybrid)',
        pure_random: 'Ngẫu nhiên (Mode 1)',
        save_user: 'Cứu user (Mode 2)',
        sweep_216: 'Quét 216 (Mode 3)',
      };
      toast.success(`⚙️ Thiết lập chế độ thành công: ${modeLabels[mode] || mode}`);
      setCurrentAdminMode(mode);
    });

    socket.on('baucua:error', ({ message }) => {
      toast.error(`❌ Lỗi từ hệ thống: ${message}`);
    });

    // Trạng thái phòng / ván mới
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
      setResultPopup(null);
      setCurrentAdminMode('auto');
    });

    // Ai đó đặt cược
    socket.on('baucua:bet_placed', ({ bet }) => {
      setRoundState(prev => prev ? { ...prev, bets: [...(prev.bets || []), bet] } : prev);
    });

    // Đã khóa cược
    socket.on('baucua:round_locked', () => {
      setRoundState(prev => prev ? { ...prev, status: 'locked' } : prev);
    });

    // Đang lắc
    socket.on('baucua:rolling', (data) => {
      setRolling(true);
      const duration = data?.duration || 4000;
      setRoundState(prev => prev ? {
        ...prev,
        status: 'rolling',
        rollingEndsAt: new Date(Date.now() + duration).toISOString()
      } : prev);
      if (soundEnabledRef.current) {
        shakeAudioRef.current.currentTime = 0;
        shakeAudioRef.current.play().catch(e => console.warn(e));
      }
    });

    // Kết quả (dùng ref — tránh reconnect socket khi balance/user đổi trước khi nhận event)
    socket.on('baucua:result', (data) => {
      setRolling(false);
      setDiceResult(data.result);
      setRoundState(prev => prev ? { ...prev, status: 'finished', bets: data.bets } : prev);

      const currentUser = userRef.current;
      if (currentUser) {
        const myId = currentUser._id ?? currentUser.id;
        const myBetsList = (data.bets || []).filter(b => sameUserId(b.userId, myId) && !b.isBot);
        const totalProfit = myBetsList.reduce((s, b) => s + (b.profit || 0), 0);
        const totalPayout = myBetsList.reduce((s, b) => s + (b.payout || 0), 0);
        if (myBetsList.length > 0 && totalProfit > 0) {
          setResultPopup({ result: data.result, myProfit: totalProfit, myBets: myBetsList });
          if (soundEnabledRef.current) {
            winAudioRef.current.currentTime = 0;
            winAudioRef.current.play().catch(e => console.warn(e));
          }
          toast.success(`🎉 Thắng +${totalProfit.toLocaleString()}đ (nhận ${totalPayout.toLocaleString()}đ)!`, { autoClose: 4000 });
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        }
        const newBal = data.userBalances?.[String(myId)];
        if (newBal !== undefined && updateBalanceRef.current) {
          updateBalanceRef.current(newBal);
        }
      }

      loadHistory();
    });

    return () => {
      socket.emit('baucua:leave_room', roomId);
      socket.disconnect();
    };
  }, [roomId, token, loadHistory]);

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
            rollingEndsAt: round.rollingEndsAt,
            bets: round.bets || [],
          });
          if (round.status === 'finished') {
            setDiceResult(round.result || [null, null, null]);
          } else {
            setCurrentAdminMode(round.adminModeOverride || 'auto');
          }
        }
      } catch {
        toast.error('Không thể tải thông tin phòng');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
    loadHistory();
  }, [roomId, loadHistory]);

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
        betAudioRef.current.currentTime = 0;
        betAudioRef.current.play().catch(e => console.warn(e));
      }
      setMyBets(prev => ({ ...prev, [symbolKey]: (prev[symbolKey] || 0) + betAmount }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt cược thất bại');
    } finally {
      setBetLoading(false);
    }
  };

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
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] text-red-400 font-bold">LIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* CỘT TRÁI: THÔNG TIN VÁN + LỊCH SỬ */}
          <div className="lg:col-span-3 space-y-4">

            {/* Lịch sử ván */}
            <div className="glass-card p-4 space-y-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Kết quả gần đây</p>
              {history.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-2">Chưa có kết quả</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {history.slice(0, 10).map(h => (
                    <div key={h._id} className="flex items-center justify-between text-[11px] py-1 border-b border-white/3 last:border-0">
                      <span className="text-white/40 font-mono font-bold">Ván #{h.roundNumber}</span>
                      <div className="flex gap-1">
                        {(h.result || []).map((r, i) => (
                          <span key={i} className="text-lg filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                            {SYMBOL_MAP[r]?.emoji || '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PANEL ADMIN CAN THIỆP KẾT QUẢ */}
            {user?.role === 'admin' && (
              <div className="glass-card p-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)] space-y-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                    🎛️ Can thiệp kết quả (Admin)
                  </p>
                  <div className="text-[10px] text-white/50 leading-relaxed">
                    Chọn đúng 3 hình linh vật để đặt trước kết quả cho ván này (trước khi kết thúc thời gian cược).
                  </div>
                  
                  {/* 6 linh vật để chọn */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {SYMBOLS.map(sym => {
                      const count = adminOverrideSelection.filter(s => s === sym.key).length;
                      const isSelected = count > 0;
                      return (
                        <button
                          key={sym.key}
                          type="button"
                          onClick={() => handleAdminSelect(sym.key)}
                          className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all relative ${
                            isSelected 
                              ? 'bg-red-500/10 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] scale-105 animate-pulse' 
                              : 'bg-white/3 border-white/5 hover:bg-white/5 text-white/70'
                          }`}
                        >
                          {count > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                              x{count}
                            </div>
                          )}
                          <span className="text-xl">{sym.emoji}</span>
                          <span className="text-[9px] font-medium mt-0.5">{sym.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAdminClear}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 text-white/70 text-[10px] font-bold transition-all"
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminSubmit}
                      disabled={adminOverrideSelection.length !== 3}
                      className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-red-500 text-white text-[10px] font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 my-2" />

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    ⚙️ Thiết lập Chế độ game (Admin)
                  </p>
                  <div className="text-[10px] text-white/50 leading-relaxed">
                    Ép buộc thuật toán chạy chế độ mong muốn cho ván hiện tại.
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdminModeSubmit('auto')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                        currentAdminMode === 'auto'
                          ? 'bg-white/20 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.25)]'
                          : 'bg-white/5 border-white/8 hover:bg-white/10 text-white/80'
                      }`}
                    >
                      🤖 Tự động (Hybrid)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminModeSubmit('pure_random')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                        currentAdminMode === 'pure_random'
                          ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.45)]'
                          : 'bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400'
                      }`}
                    >
                      🎲 Ngẫu nhiên (Mode 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminModeSubmit('save_user')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                        currentAdminMode === 'save_user'
                          ? 'bg-blue-500 border-blue-400 text-black shadow-[0_0_10px_rgba(59,130,246,0.45)]'
                          : 'bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25 text-blue-400'
                      }`}
                    >
                      🎣 Cứu user (Mode 2)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminModeSubmit('sweep_216')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                        currentAdminMode === 'sweep_216'
                          ? 'bg-purple-500 border-purple-400 text-black shadow-[0_0_10px_rgba(168,85,247,0.45)]'
                          : 'bg-purple-500/15 border-purple-500/30 hover:bg-purple-500/25 text-purple-400'
                      }`}
                    >
                      🕸️ Quét 216 (Mode 3)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT GIỮA: ĐĨA XÓC + BÀN CƯỢC */}
          <div className="lg:col-span-6 space-y-5">

            {/* Dĩa xóc + 3 con + cái tô */}
            <div className="glass-card px-4 sm:px-6 pt-4 pb-5 relative overflow-hidden">
              <DicePlateArea
                diceResult={diceResult}
                rolling={rolling}
                status={roundState?.status}
              >
                {roundState && (
                  <BowlOverlay 
                    status={roundState.status} 
                    waitingEndsAt={roundState.waitingEndsAt}
                    rollingEndsAt={roundState.rollingEndsAt} 
                  />
                )}
              </DicePlateArea>

              {resultPopup && !rolling && (
                <div className="mt-1 p-3 rounded-xl bg-white/5 border border-white/8 text-center animate-scale-in">
                  <p className="text-green-400 font-black text-lg">
                    🎉 Thắng <span className="font-mono">+{resultPopup.myProfit.toLocaleString()}đ</span>
                  </p>
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
                  const totalBetAmt = (roundState?.bets || [])
                    .filter(b => b.symbol === sym.key)
                    .reduce((sum, b) => sum + b.amount, 0);
                  const canBet = roundState?.status === 'waiting' && isAuthenticated;

                  // CSS dynamic classes for high fidelity display
                  const baseClass = "relative p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all duration-300 overflow-hidden";
                  let stateClass = "";
                  
                  if (roundState?.status === 'finished') {
                    if (isWinner) {
                      stateClass = `${sym.border} ${sym.glow} bg-gradient-to-br ${sym.color}/15 scale-105 opacity-100 cursor-default`;
                    } else {
                      stateClass = "border-transparent opacity-30 cursor-default";
                    }
                  } else if (canBet) {
                    stateClass = `${sym.border} bg-gradient-to-br ${sym.color}/5 hover:bg-gradient-to-br hover:${sym.color}/15 hover:scale-105 hover:${sym.glow} active:scale-95 cursor-pointer opacity-100`;
                  } else {
                    stateClass = "border-white/8 opacity-60 cursor-default";
                  }
                  
                  const ringClass = myBetAmt > 0 ? "ring-2 ring-amber-400/50" : "";
                  const buttonClass = `${baseClass} ${stateClass} ${ringClass}`;

                  return (
                    <button
                      key={sym.key}
                      onClick={() => canBet && handleBet(sym.key)}
                      disabled={!canBet || betLoading}
                      className={buttonClass}
                    >
                      {isWinner && appearances > 0 && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                          x{appearances}
                        </div>
                      )}
                      <span className="text-3xl">{sym.emoji}</span>
                      <span className="text-[11px] font-bold text-white">{sym.label}</span>
                      {totalBetAmt > 0 && (
                        <span className="text-[9px] text-white/50">
                          Tổng: {totalBetAmt.toLocaleString()}đ
                        </span>
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

          {/* CỘT PHẢI: DANH SÁCH CƯỢC + CHAT */}
          <div className="lg:col-span-3 space-y-4">
            {/* Lệnh cược */}
            <div className="glass-card p-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1">
                <FiZap /> Lệnh cược ván này
              </p>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {(roundState?.bets || []).length === 0 ? (
                  <p className="text-[10px] text-white/20 text-center py-4">Chưa có lệnh cược</p>
                ) : (
                  [...(roundState?.bets || [])].reverse().map((b, i) => {
                    const sym = SYMBOL_MAP[b.symbol];
                    const isMe = sameUserId(b.userId, user?._id ?? user?.id);
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

            {/* Box Chat Real-time */}
            <div className="glass-card p-4 flex flex-col h-[280px]">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1">
                💬 Trò chuyện trực tuyến
              </p>
              
              {/* Tin nhắn */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-[11px] scroll-smooth"
              >
                {chatMessages.length === 0 ? (
                  <p className="text-white/20 text-center py-12">Chưa có tin nhắn nào. Hãy gửi lời chào!</p>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isMe = sameUserId(msg.userId, user?._id ?? user?.id);
                    const isAdmin = msg.role === 'admin';
                    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    
                    return (
                      <div key={i} className="break-words">
                        <span className="text-[9px] text-white/20 mr-1.5">{timeStr}</span>
                        <span className={`font-bold mr-1.5 ${
                          isAdmin 
                            ? 'text-red-400 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 text-[9px]' 
                            : isMe 
                              ? 'text-amber-400' 
                              : 'text-sky-400'
                        }`}>
                          {isAdmin && '👑 '}{msg.username}
                        </span>
                        <span className="text-white/80">{msg.message}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Nhập chat */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={isAuthenticated ? "Nhập tin nhắn..." : "Đăng nhập để chat"}
                  disabled={!isAuthenticated}
                  className="input-field text-[11px] py-1.5 px-3 flex-1 bg-white/3 border-white/5 focus:border-amber-500/30"
                />
                <button
                  type="submit"
                  disabled={!isAuthenticated || !chatInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-black text-[10px] font-bold transition-all"
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
