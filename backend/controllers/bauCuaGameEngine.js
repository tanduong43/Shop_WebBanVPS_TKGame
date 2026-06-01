// controllers/bauCuaGameEngine.js
// ============================================================
// Game Loop Engine cho Bầu Cua Tôm Cá Real-time
// ============================================================
// Không cần import mongoose (đã loại bỏ Transaction/Session)
const BauCuaRoom = require('../models/BauCuaRoom');
const BauCuaRound = require('../models/BauCuaRound');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const {
  BAUCUA_SYMBOLS,
  BAUCUA_STATUS,
  BAUCUA_MODE,
  BAUCUA_LIMITS,
  TRANSACTION_TYPES,
} = require('../config/constants');

let io = null;
const activeRooms = new Map(); // roomId -> { timer, currentRoundId }

// ─── BOT DATA ────────────────────────────────────────────────────────────────
const BOT_NAMES = [
  'Long_Bear', 'TigerKing99', 'lucky_star', 'ProBet_2k',
  'NightWolf', 'GoldFish88', 'DragonLord', 'QuickBet',
  'VIP_Player', 'Master_Game', 'RedRooster', 'BlueShark',
];

function getRandomBots(count) {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── THUẬT TOÁN CỐT LÕI ──────────────────────────────────────────────────────

/** Sinh 1 bộ 3 xúc xắc ngẫu nhiên */
function randomDice() {
  return [
    BAUCUA_SYMBOLS[Math.floor(Math.random() * 6)],
    BAUCUA_SYMBOLS[Math.floor(Math.random() * 6)],
    BAUCUA_SYMBOLS[Math.floor(Math.random() * 6)],
  ];
}

/** Sinh tất cả 216 tổ hợp xúc xắc (6^3) */
function generateAll216() {
  const results = [];
  for (const a of BAUCUA_SYMBOLS)
    for (const b of BAUCUA_SYMBOLS)
      for (const c of BAUCUA_SYMBOLS)
        results.push([a, b, c]);
  return results;
}

/**
 * Tính lãi/lỗ thuần của TỪng lệnh cược đối với 1 kết quả nhất định.
 * profit > 0 = user thắng | profit < 0 = user thua
 */
function calcProfit(bet, result) {
  const appearances = result.filter(s => s === bet.symbol).length;
  if (appearances === 0) return -bet.amount;
  return bet.amount * appearances; // Lãi thuần (chưa tính gốc)
}

/**
 * Tính lợi nhuận của Nhà Cái từ 1 kết quả & danh sách cược user thật.
 * houseProft = sum(tất cả lỗ user) - sum(tất cả lãi user)
 */
function calcHouseProfit(result, realBets) {
  let profit = 0;
  for (const bet of realBets) {
    profit -= calcProfit(bet, result); // Ngược chiều user
  }
  return profit;
}

/**
 * THUẬT TOÁN HYBRID 3 CHẾ ĐỘ
 */
async function hybridAlgorithm(round, roomId) {
  // Lấy bets user thật (bỏ bot)
  const realBets = round.bets.filter(b => !b.isBot);
  const realUserIds = [...new Set(realBets.map(b => b.userId?.toString()).filter(Boolean))];
  const totalRealBet = realBets.reduce((s, b) => s + b.amount, 0);

  // ── CHẾ ĐỘ 1: PURE RANDOM ───────────────────────────────────────────────────
  if (
    realUserIds.length <= BAUCUA_LIMITS.LOW_USER_THRESHOLD &&
    totalRealBet < BAUCUA_LIMITS.LOW_BET_THRESHOLD
  ) {
    console.log(`🎲 [Room ${roomId}] MODE 1: Pure Random`);
    return { result: randomDice(), mode: BAUCUA_MODE.PURE_RANDOM };
  }

  // ── CHẾ ĐỘ 2: SAVE USER ─────────────────────────────────────────────────────
  // Tìm user mới chơi (< 3 ván tổng) hoặc đang thua streak
  let targetUserId = null;
  for (const uid of realUserIds) {
    const recentRounds = await BauCuaRound.find({
      roomId,
      status: BAUCUA_STATUS.FINISHED,
      'bets.userId': uid,
    }).sort({ roundNumber: -1 }).limit(BAUCUA_LIMITS.SAVE_USER_STREAK).lean();

    const totalRoundsPlayed = await BauCuaRound.countDocuments({
      roomId,
      'bets.userId': uid,
    });

    // User mới (ít hơn 3 ván) → thả mồi
    if (totalRoundsPlayed <= 1) {
      targetUserId = uid;
      break;
    }

    // User thua liên tiếp
    if (recentRounds.length >= BAUCUA_LIMITS.SAVE_USER_STREAK) {
      const allLoss = recentRounds.every(r => {
        const userBets = r.bets.filter(b => b.userId?.toString() === uid);
        return userBets.every(b => b.profit < 0);
      });
      if (allLoss) {
        targetUserId = uid;
        break;
      }
    }
  }

  if (targetUserId) {
    console.log(`🎣 [Room ${roomId}] MODE 2: Save User ${targetUserId}`);
    const targetBets = realBets.filter(b => b.userId?.toString() === targetUserId);
    // Thử 200 kết quả ngẫu nhiên, lấy cái có lợi nhất cho target user
    let bestResult = randomDice();
    let bestProfit = -Infinity;
    for (let i = 0; i < 200; i++) {
      const candidate = randomDice();
      const userProfit = targetBets.reduce((s, b) => s + calcProfit(b, candidate), 0);
      if (userProfit > bestProfit) {
        bestProfit = userProfit;
        bestResult = candidate;
      }
    }
    return { result: bestResult, mode: BAUCUA_MODE.SAVE_USER };
  }

  // ── CHẾ ĐỘ 3: SWEEP 216 ─────────────────────────────────────────────────────
  console.log(`🕸️ [Room ${roomId}] MODE 3: Sweep 216`);
  const all216 = generateAll216();
  const withProfit = all216.map(combo => ({
    result: combo,
    houseProfit: calcHouseProfit(combo, realBets),
  }));

  // Ưu tiên: House lời > 0
  const positive = withProfit.filter(x => x.houseProfit > 0);
  const pool = positive.length > 0 ? positive : withProfit.sort((a, b) => b.houseProfit - a.houseProfit).slice(0, 30);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return { result: picked.result, mode: BAUCUA_MODE.SWEEP_216 };
}

// ─── XỬ LÝ PAYOUT (KHÔNG CẦN TRANSACTION – TƯƠNG THÍCH STANDALONE MONGODB) ──

async function processPayout(round) {
  try {
    const updatedBets = [];

    for (const bet of round.bets) {
      const appearances = round.result.filter(s => s === bet.symbol).length;
      const profit = appearances > 0 ? bet.amount * appearances : -bet.amount;
      const payout = appearances > 0 ? bet.amount + bet.amount * appearances : 0;

      updatedBets.push({ ...bet, payout, profit });

      // Chỉ cộng/trừ tiền user thật (không phải bot)
      if (!bet.isBot && bet.userId) {
        // Atomic update – an toàn trên standalone MongoDB
        await User.findByIdAndUpdate(
          bet.userId,
          { $inc: { balance: profit } } // profit < 0 → tự trừ
        );

        // Ghi nhật ký biến động số dư
        const tx = new Transaction({
          userId: bet.userId,
          type: profit > 0 ? TRANSACTION_TYPES.BAUCUA_WIN : TRANSACTION_TYPES.BAUCUA_BET,
          amount: profit,
          balanceBefore: 0,
          balanceAfter: 0,
          description: `Bầu Cua: Cược ${bet.symbol.toUpperCase()} ${bet.amount.toLocaleString()}đ - ${profit > 0 ? '+' : ''}${profit.toLocaleString()}đ`,
        });
        await tx.save();
      }
    }

    const totalPayout = updatedBets.filter(b => !b.isBot).reduce((s, b) => s + b.payout, 0);
    const totalRealBet = updatedBets.filter(b => !b.isBot).reduce((s, b) => s + b.amount, 0);
    const houseProfit = totalRealBet - (totalPayout - totalRealBet);

    await BauCuaRound.findByIdAndUpdate(
      round._id,
      {
        bets: updatedBets,
        status: BAUCUA_STATUS.FINISHED,
        finishedAt: new Date(),
        totalRealBets: totalRealBet,
        totalPayout,
        houseProfit,
      }
    );

    await BauCuaRoom.findByIdAndUpdate(
      round.roomId,
      { $inc: { totalRounds: 1, totalVolume: totalRealBet } }
    );

    console.log(`✅ Payout thành công: ${updatedBets.length} lệnh cược, House profit: ${houseProfit.toLocaleString()}đ`);
    return updatedBets;
  } catch (err) {
    console.error('❌ Payout failed:', err.message);
    throw err;
  }
}

// ─── VÒNG LẶP GAME (MAIN LOOP) ───────────────────────────────────────────────

async function runRound(roomId) {
  if (!activeRooms.has(roomId)) return;

  try {
    const room = await BauCuaRoom.findById(roomId);
    if (!room || !room.isActive) {
      activeRooms.delete(roomId);
      return;
    }

    // Lấy round number mới nhất
    const lastRound = await BauCuaRound.findOne({ roomId }).sort({ roundNumber: -1 }).lean();
    const roundNumber = (lastRound?.roundNumber || 0) + 1;

    const waitingEndsAt = new Date(Date.now() + BAUCUA_LIMITS.WAITING_SECONDS * 1000);

    // 1. TẠO VÁN MỚI
    const round = await BauCuaRound.create({
      roomId,
      roundNumber,
      status: BAUCUA_STATUS.WAITING,
      waitingEndsAt,
    });

    activeRooms.set(roomId, { ...activeRooms.get(roomId), currentRoundId: round._id.toString() });

    // Phát trạng thái phòng
    emitRoomState(roomId, round, 'waiting');

    // 2. BOT ĐẶT CƯỢC NGẪU NHIÊN (trong 15s)
    const botNames = getRandomBots(
      BAUCUA_LIMITS.BOT_COUNT_MIN + Math.floor(Math.random() * (BAUCUA_LIMITS.BOT_COUNT_MAX - BAUCUA_LIMITS.BOT_COUNT_MIN + 1))
    );
    spawnBotBets(round._id, roomId, botNames, BAUCUA_LIMITS.WAITING_SECONDS * 1000);

    // 3. CHỜ HẾT THỜI GIAN CƯỢC
    await sleep(BAUCUA_LIMITS.WAITING_SECONDS * 1000);

    // 4. KHÓA CƯỢC
    await BauCuaRound.findByIdAndUpdate(round._id, { status: BAUCUA_STATUS.LOCKED });
    io && io.to(`baucua:${roomId}`).emit('baucua:round_locked', { roundId: round._id, roundNumber });

    await sleep(500); // Delay nhỏ

    // 5. TÍNH KẾT QUẢ (HYBRID ALGORITHM)
    const freshRound = await BauCuaRound.findById(round._id).lean();

    let finalResult;
    let gameMode;

    // Kiểm tra Admin Override
    if (freshRound.adminOverride && freshRound.adminOverride.length === 3) {
      finalResult = freshRound.adminOverride;
      gameMode = 'admin_override';
      console.log(`🎛️ [Room ${roomId}] ADMIN OVERRIDE: ${finalResult.join(', ')}`);
    } else {
      const hybrid = await hybridAlgorithm(freshRound, roomId);
      finalResult = hybrid.result;
      gameMode = hybrid.mode;
    }

    // 6. PHÁT ROLLING (LẮC XÚC XẮC)
    await BauCuaRound.findByIdAndUpdate(round._id, {
      status: BAUCUA_STATUS.ROLLING,
      result: finalResult,
      gameMode,
      rollingEndsAt: new Date(Date.now() + BAUCUA_LIMITS.ROLLING_SECONDS * 1000),
    });

    io && io.to(`baucua:${roomId}`).emit('baucua:rolling', {
      roundId: round._id,
      duration: BAUCUA_LIMITS.ROLLING_SECONDS * 1000,
    });

    // 7. ĐỢI ANIMATION LẮC
    await sleep(BAUCUA_LIMITS.ROLLING_SECONDS * 1000);

    // 8. XỬ LÝ PAYOUT
    const updatedRound = await BauCuaRound.findById(round._id).lean();
    const paidBets = await processPayout(updatedRound);

    // 9. PHÁT KẾT QUẢ
    // Lấy balance mới nhất của từng user thật
    const realUserUpdates = {};
    for (const bet of paidBets) {
      if (!bet.isBot && bet.userId) {
        const u = await User.findById(bet.userId).select('balance').lean();
        if (u) realUserUpdates[bet.userId.toString()] = u.balance;
      }
    }

    io && io.to(`baucua:${roomId}`).emit('baucua:result', {
      roundId: round._id,
      roundNumber,
      result: finalResult,
      gameMode,
      bets: paidBets,
      userBalances: realUserUpdates,
    });

    // Gửi cập nhật balance cá nhân cho từng user
    for (const [uid, balance] of Object.entries(realUserUpdates)) {
      io && io.to(`user:${uid}`).emit('balance:updated', { balance });
    }

    // 10. ĐỢI HIỂN THỊ KẾT QUẢ
    await sleep(BAUCUA_LIMITS.RESULT_DISPLAY_SECONDS * 1000);

    // 11. VÁN MỚI
    if (activeRooms.has(roomId)) {
      runRound(roomId);
    }

  } catch (err) {
    console.error(`❌ Game loop error in room ${roomId}:`, err.message);
    // Retry sau 5s
    if (activeRooms.has(roomId)) {
      setTimeout(() => runRound(roomId), 5000);
    }
  }
}

/** Phát state hiện tại của phòng */
function emitRoomState(roomId, round, status) {
  io && io.to(`baucua:${roomId}`).emit('baucua:room_state', {
    roomId,
    roundId: round._id,
    roundNumber: round.roundNumber,
    status,
    waitingEndsAt: round.waitingEndsAt,
    bets: round.bets || [],
  });
}

/** Bot tự động đặt cược */
async function spawnBotBets(roundId, roomId, botNames, totalMs) {
  const betCount = botNames.length;
  for (let i = 0; i < betCount; i++) {
    const delay = Math.floor(Math.random() * (totalMs * 0.8));
    setTimeout(async () => {
      try {
        const round = await BauCuaRound.findById(roundId).lean();
        if (!round || round.status !== BAUCUA_STATUS.WAITING) return;

        const symbol = BAUCUA_SYMBOLS[Math.floor(Math.random() * BAUCUA_SYMBOLS.length)];
        const amount = (Math.floor(Math.random() * 10) + 1) * 5000; // 5k → 50k

        const bet = {
          userId: null,
          username: botNames[i],
          symbol,
          amount,
          isBot: true,
        };

        await BauCuaRound.findByIdAndUpdate(roundId, { $push: { bets: bet } });

        io && io.to(`baucua:${roomId}`).emit('baucua:bet_placed', {
          roundId,
          bet: { ...bet, _isBot: true },
          timestamp: new Date(),
        });
      } catch (err) {
        // Silent fail for bot bets
      }
    }, delay);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Khởi tạo engine với io instance */
async function initGameEngine(ioInstance) {
  io = ioInstance;

  // Xử lý admin override qua socket
  io.on('connection', (socket) => {
    // Join room baucua
    socket.on('baucua:join_room', (roomId) => {
      socket.join(`baucua:${roomId}`);
      console.log(`👤 ${socket.user.username} joined baucua room ${roomId}`);
    });

    socket.on('baucua:leave_room', (roomId) => {
      socket.leave(`baucua:${roomId}`);
    });

    // Admin override kết quả
    if (socket.user.role === 'admin') {
      socket.on('baucua:admin_override', async ({ roomId, result }) => {
        try {
          if (!Array.isArray(result) || result.length !== 3 || !result.every(s => BAUCUA_SYMBOLS.includes(s))) {
            socket.emit('baucua:error', { message: 'Kết quả override không hợp lệ (cần 3 symbol hợp lệ)' });
            return;
          }
          const roomState = activeRooms.get(roomId);
          if (!roomState?.currentRoundId) {
            socket.emit('baucua:error', { message: 'Không tìm thấy ván đang chạy cho phòng này' });
            return;
          }
          await BauCuaRound.findByIdAndUpdate(roomState.currentRoundId, { adminOverride: result });
          socket.emit('baucua:override_success', { roomId, result });
          io.to('admin:room').emit('baucua:override_set', {
            roomId, result, by: socket.user.username
          });
          console.log(`🎛️ Admin ${socket.user.username} override room ${roomId}: ${result.join(', ')}`);
        } catch (err) {
          socket.emit('baucua:error', { message: err.message });
        }
      });
    }
  });

  // Khởi động lại vòng lặp cho tất cả phòng đang active
  const activeRoomDocs = await BauCuaRoom.find({ isActive: true }).lean();
  for (const room of activeRoomDocs) {
    startRoom(room._id.toString());
  }
  console.log(`🎮 BauCua Game Engine khởi động: ${activeRoomDocs.length} phòng đang hoạt động`);
}

/** Bắt đầu vòng lặp cho 1 phòng */
function startRoom(roomId) {
  const rid = roomId.toString();
  if (activeRooms.has(rid)) {
    console.log(`⚠️ Room ${rid} đang chạy rồi`);
    return;
  }
  activeRooms.set(rid, { currentRoundId: null });
  runRound(rid);
  console.log(`▶️ Room ${rid} started`);
}

/** Dừng vòng lặp cho 1 phòng */
function stopRoom(roomId) {
  const rid = roomId.toString();
  activeRooms.delete(rid);
  io && io.to(`baucua:${rid}`).emit('baucua:room_stopped', { roomId: rid });
  console.log(`⏹️ Room ${rid} stopped`);
}

/** Lấy state hiện tại của phòng */
function getRoomState(roomId) {
  return activeRooms.get(roomId.toString()) || null;
}

module.exports = { initGameEngine, startRoom, stopRoom, getRoomState };
