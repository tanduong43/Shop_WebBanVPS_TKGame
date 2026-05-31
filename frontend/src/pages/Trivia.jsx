// src/pages/Trivia.jsx - Đố Vui Sinh Tồn: Lobby + Battle Royale UI
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { triviaAPI } from '../services/api';
import {
  FiUsers, FiPlay, FiCopy, FiZap, FiShield, FiHeart,
  FiArrowLeft, FiClock,
} from 'react-icons/fi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const PHASE = { MENU: 'menu', LOBBY: 'lobby', PLAYING: 'playing', FINISHED: 'finished' };

const OUTCOME_LABEL = {
  shield: { text: 'Khiên bảo vệ!', color: 'text-cyan-400', icon: FiShield },
  slow: { text: '-5 HP', color: 'text-yellow-400', icon: FiZap },
  wrong: { text: '-15 HP', color: 'text-red-400', icon: FiHeart },
};

function PlayerHpCard({ player, highlight }) {
  const hpPercent = Math.max(0, Math.min(100, player.hp));
  const isDead = player.status === 'spectator';

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all ${
        isDead
          ? 'border-white/5 bg-white/2 opacity-50'
          : highlight
            ? 'border-primary-500/50 bg-primary-500/10 shadow-glow-primary/20'
            : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
            isDead ? 'bg-white/10 text-white/30' : 'bg-gradient-to-br from-primary-500 to-accent-500 text-white'
          }`}
        >
          {player.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {player.username}
            {player.isHost && <span className="text-[10px] text-amber-400 ml-1">HOST</span>}
          </p>
          {isDead && <p className="text-[10px] text-white/30">Khán giả</p>}
        </div>
        <span className={`text-sm font-bold ${isDead ? 'text-white/30' : 'text-green-400'}`}>
          {player.hp} HP
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function Trivia() {
  const { isAuthenticated, token, user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [phase, setPhase] = useState(PHASE.MENU);
  const [topics, setTopics] = useState([]);
  const [room, setRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [createTopicId, setCreateTopicId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [withBot, setWithBot] = useState(false);
  const [questionMode, setQuestionMode] = useState('10');

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lastResults, setLastResults] = useState(null);
  const [gameOver, setGameOver] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    triviaAPI.getTopics().then((res) => {
      const list = res.data.data || [];
      setTopics(list);
      if (list.length) setCreateTopicId(list[0]._id);
    }).catch(() => toast.error('Không tải được đề tài'));
  }, [isAuthenticated]);

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;

    const socket = socketIO(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('trivia:error', ({ message }) => toast.error(message));

    socket.on('trivia:room_created', (data) => {
      setRoom(data);
      setPhase(PHASE.LOBBY);
      toast.success(`Phòng ${data.roomCode} đã tạo`);
    });

    socket.on('trivia:room_joined', (data) => {
      setRoom(data);
      setPhase(PHASE.LOBBY);
    });

    socket.on('trivia:room_state', (data) => {
      setRoom(data);
    });

    socket.on('trivia:game_started', () => {
      setPhase(PHASE.PLAYING);
      setLastResults(null);
      setGameOver(null);
    });

    socket.on('trivia:question_start', (data) => {
      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setLastResults(null);
      setTimeLeft(data.timeLimit);
    });

    socket.on('trivia:answer_received', () => {
      // Answer locked on client
    });

    socket.on('trivia:question_result', (data) => {
      setLastResults(data);
      if (data.players) {
        setRoom((prev) => (prev ? { ...prev, players: data.players } : prev));
      }
    });

    socket.on('trivia:game_over', (data) => {
      setGameOver(data);
      setPhase(PHASE.FINISHED);
      setCurrentQuestion(null);
    });

    return socket;
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/games/trivia' } });
      return undefined;
    }

    const socket = connectSocket();
    return () => {
      socket.emit('trivia:leave_room');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, connectSocket, navigate]);

  // Countdown timer
  useEffect(() => {
    if (phase !== PHASE.PLAYING || !currentQuestion) return undefined;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((currentQuestion.deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 200);

    return () => clearInterval(interval);
  }, [phase, currentQuestion]);

  const handleCreateRoom = () => {
    const socket = connectSocket();
    socket.emit('trivia:create_room', { topicId: createTopicId, maxPlayers, withBot, questionMode });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return toast.warning('Nhập mã phòng 6 số');
    connectSocket().emit('trivia:join_room', { roomCode: joinCode.trim() });
  };

  const handleStartGame = () => {
    connectSocket().emit('trivia:START_GAME');
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    connectSocket().emit('trivia:submit_answer', { selectedIndex: index });
  };

  const copyRoomCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      toast.success('Đã copy mã phòng');
    }
  };

  const isHost = room?.isHost || room?.hostId === user?._id;
  const myResult = lastResults?.results?.find((r) => r.userId === user?._id);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button type="button" onClick={() => navigate('/games')} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5">
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-black gradient-text">Đố Vui Sinh Tồn</h1>
            <p className="text-white/40 text-sm">Battle Royale — Trả lời nhanh để sống sót!</p>
          </div>
        </div>

        {/* MENU: Create / Join */}
        {phase === PHASE.MENU && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <FiPlay className="text-primary-400" /> Tạo phòng mới
              </h2>
              <select
                value={createTopicId}
                onChange={(e) => setCreateTopicId(e.target.value)}
                className="input-field w-full"
              >
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs">Số người (2-10)</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="input-field w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs">Số câu hỏi</label>
                  <select
                    value={questionMode}
                    onChange={(e) => setQuestionMode(e.target.value)}
                    className="input-field w-full mt-1"
                  >
                    <option value="10">10 Câu</option>
                    <option value="20">20 Câu</option>
                    <option value="30">30 Câu</option>
                    <option value="survival">Sinh tồn (Tới khi hết HP)</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={withBot}
                  onChange={(e) => setWithBot(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900"
                />
                Thêm Bot tự động (Đấu với Bot)
              </label>
              <button type="button" onClick={handleCreateRoom} className="btn-primary w-full mt-2">
                Tạo phòng
              </button>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <FiUsers className="text-accent-400" /> Vào phòng
              </h2>
              <input
                type="text"
                maxLength={6}
                placeholder="Mã phòng 6 số"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                className="input-field w-full text-center text-2xl tracking-widest font-mono"
              />
              <button type="button" onClick={handleJoinRoom} className="btn-secondary w-full">
                Tham gia
              </button>
            </div>
          </div>
        )}

        {/* LOBBY */}
        {phase === PHASE.LOBBY && room && (
          <div className="space-y-6">
            <div className="glass-card p-6 text-center">
              <p className="text-white/50 text-sm mb-1">Mã phòng</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black text-white tracking-[0.3em] font-mono">
                  {room.roomCode}
                </span>
                <button type="button" onClick={copyRoomCode} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5">
                  <FiCopy />
                </button>
              </div>
              <p className="text-white/40 text-sm mt-2">{room.topicName}</p>
              <div className="flex items-center justify-center gap-4 mt-1">
                <p className="text-white/30 text-xs">
                  {room.players?.length || 0}/{room.maxPlayers} người chơi
                </p>
                <span className="text-white/30 text-xs">•</span>
                <p className="text-primary-400/80 text-xs font-semibold">
                  Chế độ: {room.questionMode === 'survival' ? 'Sinh Tồn' : `${room.questionMode} Câu`}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-white/60 text-sm mb-3 flex items-center gap-2">
                <FiUsers /> Người chơi trong phòng
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {room.players?.map((p) => (
                  <PlayerHpCard key={p.userId} player={p} />
                ))}
              </div>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={handleStartGame}
                disabled={(room.players?.length || 0) < 2}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <FiPlay /> Bắt đầu
              </button>
            )}

            {!isHost && (
              <p className="text-center text-white/40 text-sm animate-pulse">
                Đang chờ Host bắt đầu trận đấu...
              </p>
            )}
          </div>
        )}

        {/* PLAYING */}
        {phase === PHASE.PLAYING && (
          <div className="space-y-6">
            {/* HP Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {(room?.players || []).map((p) => (
                <PlayerHpCard
                  key={p.userId}
                  player={p}
                  highlight={p.userId === user?._id}
                />
              ))}
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">
                    Câu {currentQuestion.index + 1}/{currentQuestion.total}
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-accent-400'}`}>
                    <FiClock /> {timeLeft}s
                  </span>
                </div>

                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all duration-200"
                    style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
                  />
                </div>

                <h2 className="text-xl font-bold text-white text-center py-4">
                  {currentQuestion.question}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswer(i)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedAnswer === i
                          ? 'border-primary-500 bg-primary-500/20 text-white'
                          : selectedAnswer !== null
                            ? 'border-white/5 bg-white/2 text-white/30'
                            : 'border-white/10 bg-white/5 text-white hover:border-primary-500/40 hover:bg-primary-500/10'
                      }`}
                    >
                      <span className="text-primary-400 font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>

                {selectedAnswer !== null && (
                  <p className="text-center text-white/40 text-sm">Đã gửi đáp án — chờ kết quả...</p>
                )}
              </div>
            )}

            {/* Round result overlay */}
            {lastResults && myResult && (
              <div className="glass-card p-4 border border-white/10 animate-scale-in">
                <div className="flex items-center justify-center gap-3">
                  {(() => {
                    const cfg = OUTCOME_LABEL[myResult.outcome];
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className={cfg.color} />
                        <span className={`font-bold ${cfg.color}`}>{cfg.text}</span>
                        <span className="text-white/50">→ {myResult.hp} HP</span>
                      </>
                    );
                  })()}
                </div>
                {myResult.eliminated && (
                  <p className="text-center text-red-400 text-sm mt-2">Bạn đã bị loại — chuyển sang khán giả</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* FINISHED */}
        {phase === PHASE.FINISHED && gameOver && (
          <div className="glass-card p-8 text-center space-y-4">
            <p className="text-4xl">🏆</p>
            <h2 className="text-2xl font-bold text-white">Trận đấu kết thúc!</h2>
            {gameOver.winner && (
              <p className="text-accent-400 text-lg">
                Người chiến thắng: <strong>{gameOver.winner.username}</strong> ({gameOver.winner.hp} HP)
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {(gameOver.rankings || gameOver.players || []).map((p, i) => (
                <div key={p.userId} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 text-xs">#{i + 1}</span>
                  <p className="text-white font-semibold">{p.username}</p>
                  <p className="text-green-400 text-sm">{p.hp} HP</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setPhase(PHASE.MENU); setRoom(null); setGameOver(null); }}
              className="btn-primary mt-4"
            >
              Về menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
