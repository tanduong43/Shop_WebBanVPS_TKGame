// controllers/triviaGameEngine.js - Socket.io engine Đố Vui Sinh Tồn
const Question = require('../models/Question');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const { TRIVIA_LIMITS, TRIVIA_PLAYER_STATUS, TRIVIA_ROOM_STATUS } = require('../config/constants');

let io = null;

/** @type {Map<string, TriviaRoom>} roomCode -> room state */
const activeRooms = new Map();

/** @type {Map<string, string>} userId -> roomCode (tránh join nhiều phòng) */
const userRoomMap = new Map();

const generateRoomCode = () => {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (activeRooms.has(code));
  return code;
};

const getInitials = (username) =>
  (username || '?').slice(0, 2).toUpperCase();

const serializePlayer = (player) => ({
  userId: player.userId,
  username: player.username,
  hp: player.hp,
  status: player.status,
  avatar: player.avatar,
  isHost: player.isHost,
  isBot: player.isBot || false,
});

const serializeRoom = (room, forUserId = null) => ({
  roomCode: room.roomCode,
  hostId: room.hostId,
  topicId: room.topicId,
  topicName: room.topicName,
  questionMode: room.questionMode || '10',
  maxPlayers: room.maxPlayers,
  status: room.status,
  players: [...room.players.values()].map(serializePlayer),
  currentQuestionIndex: room.currentQuestionIndex,
  totalQuestions: room.questions.length,
  isHost: forUserId ? room.hostId === forUserId : false,
});

const broadcastRoomState = (room) => {
  io.to(`trivia:${room.roomCode}`).emit('trivia:room_state', serializeRoom(room));
};

const getAlivePlayers = (room) =>
  [...room.players.values()].filter((p) => p.status === TRIVIA_PLAYER_STATUS.ALIVE);

/**
 * Fetch ngẫu nhiên 10 câu hỏi theo topicId
 */
const fetchRandomQuestions = async (topicId, limit = 10) => {
  const oid = new mongoose.Types.ObjectId(topicId);
  const questions = await Question.aggregate([
    { $match: { topicId: oid, isActive: true } },
    { $sample: { size: limit } },
    { $project: { question: 1, options: 1, correctIndex: 1 } },
  ]);
  return questions;
};

/**
 * Tính sát thương sau mỗi câu hỏi
 * Top 1 đúng + nhanh nhất: 0 damage (khiên)
 * Đúng nhưng chậm hơn: -5 HP
 * Sai hoặc AFK: -15 HP
 */
const calculateRoundDamage = (room, questionIndex) => {
  const question = room.questions[questionIndex];
  const alivePlayers = getAlivePlayers(room);
  const results = [];

  const correctAnswers = alivePlayers
    .map((player) => {
      const ans = room.answers.get(player.userId);
      if (!ans) return null;
      const isCorrect = ans.selectedIndex === question.correctIndex;
      return isCorrect ? { player, timestamp: ans.timestamp } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  const fastestUserId = correctAnswers.length > 0 ? correctAnswers[0].player.userId : null;

  for (const player of alivePlayers) {
    const ans = room.answers.get(player.userId);
    let damage = TRIVIA_LIMITS.DAMAGE_WRONG;
    let outcome = 'wrong';

    if (ans && ans.selectedIndex === question.correctIndex) {
      if (player.userId === fastestUserId) {
        damage = TRIVIA_LIMITS.DAMAGE_SHIELD;
        outcome = 'shield';
      } else {
        damage = TRIVIA_LIMITS.DAMAGE_SLOW;
        outcome = 'slow';
      }
    }

    const previousHp = player.hp;
    player.hp = Math.max(0, player.hp - damage);
    if (player.hp <= 0) {
      player.status = TRIVIA_PLAYER_STATUS.SPECTATOR;
    }

    results.push({
      userId: player.userId,
      username: player.username,
      outcome,
      damage,
      hp: player.hp,
      previousHp,
      selectedIndex: ans?.selectedIndex ?? null,
      responseTime: ans?.timestamp ?? null,
      eliminated: player.status === TRIVIA_PLAYER_STATUS.SPECTATOR && previousHp > 0,
    });
  }

  return results;
};

const checkGameEnd = (room) => {
  const alive = getAlivePlayers(room);
  const questionsDone = room.currentQuestionIndex >= room.questions.length - 1;

  if (alive.length <= 1) {
    return {
      ended: true,
      reason: alive.length === 1 ? 'last_standing' : 'all_eliminated',
      winner: alive[0] || null,
    };
  }

  if (questionsDone) {
    const sorted = [...alive].sort((a, b) => b.hp - a.hp);
    return {
      ended: true,
      reason: 'questions_exhausted',
      winner: sorted[0],
      rankings: sorted,
    };
  }

  return { ended: false };
};

const endGame = (room, endInfo) => {
  room.status = TRIVIA_ROOM_STATUS.FINISHED;
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
  if (room.botTimers) {
    room.botTimers.forEach(clearTimeout);
    room.botTimers = [];
  }

  io.to(`trivia:${room.roomCode}`).emit('trivia:game_over', {
    reason: endInfo.reason,
    winner: endInfo.winner ? serializePlayer(endInfo.winner) : null,
    rankings: (endInfo.rankings || getAlivePlayers(room))
      .map(serializePlayer)
      .sort((a, b) => b.hp - a.hp),
    players: [...room.players.values()].map(serializePlayer),
  });
};

const startNextQuestion = (room) => {
  room.currentQuestionIndex += 1;
  room.answers.clear();

  if (room.currentQuestionIndex >= room.questions.length) {
    const endInfo = checkGameEnd(room);
    if (endInfo.ended) endGame(room, endInfo);
    return;
  }

  const q = room.questions[room.currentQuestionIndex];
  const questionStartTime = Date.now();
  room.questionStartTime = questionStartTime;
  room.questionDeadline = questionStartTime + TRIVIA_LIMITS.QUESTION_SECONDS * 1000;

  io.to(`trivia:${room.roomCode}`).emit('trivia:question_start', {
    index: room.currentQuestionIndex,
    total: room.questions.length,
    question: q.question,
    options: q.options,
    timeLimit: TRIVIA_LIMITS.QUESTION_SECONDS,
    deadline: room.questionDeadline,
  });

  room.questionTimer = setTimeout(() => {
    resolveQuestion(room);
  }, TRIVIA_LIMITS.QUESTION_SECONDS * 1000);

  // Setup Bot Answers
  if (room.botTimers) {
    room.botTimers.forEach(clearTimeout);
  }
  room.botTimers = [];

  const aliveBots = [...room.players.values()].filter(p => p.isBot && p.status === TRIVIA_PLAYER_STATUS.ALIVE);
  aliveBots.forEach((bot) => {
    const delay = Math.floor(Math.random() * 6000) + 2000; // 2s to 8s
    const timerId = setTimeout(() => {
      if (room.status !== TRIVIA_ROOM_STATUS.PLAYING) return;
      if (room.answers.has(bot.userId)) return;

      const isCorrect = Math.random() < 0.7; // 70% chance correct
      let selectedIndex = q.correctIndex;

      if (!isCorrect) {
        const wrongIndices = [0, 1, 2, 3].filter(i => i !== q.correctIndex && i < q.options.length);
        if (wrongIndices.length > 0) {
          selectedIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
        }
      }

      room.answers.set(bot.userId, {
        selectedIndex,
        timestamp: Date.now() - questionStartTime,
      });

      io.to(`trivia:${room.roomCode}`).emit('trivia:answer_received', { userId: bot.userId, selectedIndex });
    }, delay);
    room.botTimers.push(timerId);
  });
};

const resolveQuestion = (room) => {
  if (room.status !== TRIVIA_ROOM_STATUS.PLAYING) return;

  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
  if (room.botTimers) {
    room.botTimers.forEach(clearTimeout);
    room.botTimers = [];
  }

  const qIndex = room.currentQuestionIndex;
  const question = room.questions[qIndex];
  const roundResults = calculateRoundDamage(room, qIndex);

  io.to(`trivia:${room.roomCode}`).emit('trivia:question_result', {
    index: qIndex,
    correctIndex: question.correctIndex,
    results: roundResults,
    players: [...room.players.values()].map(serializePlayer),
  });

  const endInfo = checkGameEnd(room);
  if (endInfo.ended) {
    endGame(room, endInfo);
    return;
  }

  setTimeout(() => startNextQuestion(room), TRIVIA_LIMITS.RESULT_DISPLAY_SECONDS * 1000);
};

const startGame = async (room) => {
  let limit = 10;
  if (room.questionMode === 'survival') {
    limit = 200; // Số đủ lớn để lấy tất cả câu hỏi
  } else {
    limit = parseInt(room.questionMode, 10) || 10;
  }

  const questions = await fetchRandomQuestions(room.topicId, limit);

  if (questions.length < TRIVIA_LIMITS.MIN_QUESTIONS_REQUIRED) {
    io.to(`trivia:${room.roomCode}`).emit('trivia:error', {
      message: `Không đủ câu hỏi cho đề tài này (cần ít nhất ${TRIVIA_LIMITS.MIN_QUESTIONS_REQUIRED})`,
    });
    return;
  }

  room.questions = questions;
  room.status = TRIVIA_ROOM_STATUS.PLAYING;
  room.currentQuestionIndex = -1;

  io.to(`trivia:${room.roomCode}`).emit('trivia:game_started', {
    totalQuestions: questions.length,
    players: [...room.players.values()].map(serializePlayer),
  });

  startNextQuestion(room);
};

const removePlayerFromRoom = (room, userId) => {
  room.players.delete(userId);
  userRoomMap.delete(userId);

  if (room.players.size === 0 || [...room.players.values()].every(p => p.isBot)) {
    if (room.questionTimer) clearTimeout(room.questionTimer);
    if (room.botTimers) room.botTimers.forEach(clearTimeout);
    activeRooms.delete(room.roomCode);
    return 'deleted';
  }

  if (room.hostId === userId) {
    const nextHost = [...room.players.values()].find(p => !p.isBot);
    if (nextHost) {
      room.hostId = nextHost.userId;
      nextHost.isHost = true;
    }
  }

  if (room.status === TRIVIA_ROOM_STATUS.PLAYING) {
    const endInfo = checkGameEnd(room);
    if (endInfo.ended) endGame(room, endInfo);
  }

  broadcastRoomState(room);
  return 'updated';
};

const initTriviaEngine = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    socket.on('trivia:create_room', async ({ topicId, maxPlayers, withBot, questionMode = '10' }) => {
      try {
        if (userRoomMap.has(userId)) {
          return socket.emit('trivia:error', { message: 'Bạn đang ở trong một phòng khác' });
        }

        const topic = await Topic.findById(topicId);
        if (!topic || !topic.isActive) {
          return socket.emit('trivia:error', { message: 'Đề tài không hợp lệ' });
        }

        const cap = Math.min(
          TRIVIA_LIMITS.MAX_PLAYERS,
          Math.max(TRIVIA_LIMITS.MIN_PLAYERS, parseInt(maxPlayers, 10) || TRIVIA_LIMITS.MIN_PLAYERS)
        );

        const roomCode = generateRoomCode();
        const room = {
          roomCode,
          hostId: userId,
          topicId: topic._id.toString(),
          topicName: topic.name,
          questionMode,
          maxPlayers: cap,
          status: TRIVIA_ROOM_STATUS.WAITING,
          players: new Map(),
          questions: [],
          currentQuestionIndex: -1,
          answers: new Map(),
          questionTimer: null,
          questionStartTime: null,
          questionDeadline: null,
          botTimers: [],
        };

        room.players.set(userId, {
          userId,
          username: socket.user.username,
          hp: TRIVIA_LIMITS.STARTING_HP,
          status: TRIVIA_PLAYER_STATUS.ALIVE,
          avatar: getInitials(socket.user.username),
          isHost: true,
          isBot: false,
        });

        if (withBot) {
          for (let i = 1; i < cap; i++) {
            const botId = `bot_${Date.now()}_${i}`;
            room.players.set(botId, {
              userId: botId,
              username: `Bot ${i}`,
              hp: TRIVIA_LIMITS.STARTING_HP,
              status: TRIVIA_PLAYER_STATUS.ALIVE,
              avatar: '🤖',
              isHost: false,
              isBot: true,
            });
          }
        }

        activeRooms.set(roomCode, room);
        userRoomMap.set(userId, roomCode);
        socket.join(`trivia:${roomCode}`);

        socket.emit('trivia:room_created', serializeRoom(room, userId));
      } catch (err) {
        socket.emit('trivia:error', { message: 'Không thể tạo phòng' });
      }
    });

    socket.on('trivia:join_room', ({ roomCode }) => {
      const code = String(roomCode || '').trim();
      const room = activeRooms.get(code);

      if (!room) {
        return socket.emit('trivia:error', { message: 'Mã phòng không tồn tại' });
      }
      if (room.status !== TRIVIA_ROOM_STATUS.WAITING) {
        return socket.emit('trivia:error', { message: 'Trận đấu đã bắt đầu' });
      }
      if (room.players.size >= room.maxPlayers) {
        return socket.emit('trivia:error', { message: 'Phòng đã đầy' });
      }
      if (userRoomMap.has(userId) && userRoomMap.get(userId) !== code) {
        return socket.emit('trivia:error', { message: 'Bạn đang ở trong phòng khác' });
      }

      if (!room.players.has(userId)) {
        room.players.set(userId, {
          userId,
          username: socket.user.username,
          hp: TRIVIA_LIMITS.STARTING_HP,
          status: TRIVIA_PLAYER_STATUS.ALIVE,
          avatar: getInitials(socket.user.username),
          isHost: false,
        });
        userRoomMap.set(userId, code);
      }

      socket.join(`trivia:${room.roomCode}`);
      socket.emit('trivia:room_joined', serializeRoom(room, userId));
      broadcastRoomState(room);
    });

    socket.on('trivia:leave_room', () => {
      const code = userRoomMap.get(userId);
      if (!code) return;

      const room = activeRooms.get(code);
      if (!room) {
        userRoomMap.delete(userId);
        return;
      }

      socket.leave(`trivia:${code}`);
      removePlayerFromRoom(room, userId);
    });

    socket.on('trivia:START_GAME', async () => {
      const code = userRoomMap.get(userId);
      if (!code) {
        return socket.emit('trivia:error', { message: 'Bạn chưa tham gia phòng nào' });
      }

      const room = activeRooms.get(code);
      if (!room) return;

      if (room.hostId !== userId) {
        return socket.emit('trivia:error', { message: 'Chỉ Host mới có thể bắt đầu trận' });
      }
      if (room.status !== TRIVIA_ROOM_STATUS.WAITING) {
        return socket.emit('trivia:error', { message: 'Trận đã bắt đầu hoặc đã kết thúc' });
      }
      if (room.players.size < TRIVIA_LIMITS.MIN_PLAYERS) {
        return socket.emit('trivia:error', {
          message: `Cần ít nhất ${TRIVIA_LIMITS.MIN_PLAYERS} người chơi`,
        });
      }

      await startGame(room);
    });

    socket.on('trivia:submit_answer', ({ selectedIndex }) => {
      const code = userRoomMap.get(userId);
      if (!code) return;

      const room = activeRooms.get(code);
      if (!room || room.status !== TRIVIA_ROOM_STATUS.PLAYING) return;

      const player = room.players.get(userId);
      if (!player || player.status !== TRIVIA_PLAYER_STATUS.ALIVE) return;
      if (room.answers.has(userId)) return;

      const idx = parseInt(selectedIndex, 10);
      if (Number.isNaN(idx) || idx < 0 || idx > 3) return;

      if (Date.now() > room.questionDeadline) return;

      room.answers.set(userId, {
        selectedIndex: idx,
        timestamp: Date.now() - room.questionStartTime,
      });

      socket.emit('trivia:answer_received', { selectedIndex: idx });
    });

    socket.on('disconnect', () => {
      const code = userRoomMap.get(userId);
      if (!code) return;

      const room = activeRooms.get(code);
      if (!room) {
        userRoomMap.delete(userId);
        return;
      }

      removePlayerFromRoom(room, userId);
    });
  });
};

module.exports = { initTriviaEngine, activeRooms };
