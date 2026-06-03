// config/constants.js - Các hằng số toàn cục của ứng dụng

const ORDER_STATUS = {
  PENDING_CONTACT: 'pending_contact', // Chờ liên hệ qua Zalo
  COMPLETED: 'completed',             // Đã hoàn thành
  CANCELLED: 'cancelled',             // Đã hủy
};

const PRODUCT_TYPES = {
  GAME_ACCOUNT: 'game_account', // Tài khoản game
  VPS: 'vps',                   // VPS
};

const USER_ROLES = {
  USER: 'user',   // Người dùng thường
  ADMIN: 'admin', // Quản trị viên
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
};

const DEPOSIT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  ADMIN_ADJUST: 'admin_adjust',
  BAUCUA_WIN: 'baucua_win',
  BAUCUA_BET: 'baucua_bet',
};

// Bầu Cua Tôm Cá constants
const BAUCUA_SYMBOLS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];

const BAUCUA_SYMBOL_LABELS = {
  bau: 'Bầu',
  cua: 'Cua',
  tom: 'Tôm',
  ca: 'Cá',
  ga: 'Gà',
  nai: 'Nai',
};

const BAUCUA_STATUS = {
  WAITING: 'waiting',   // Đang nhận cược (15s)
  LOCKED: 'locked',     // Đã khóa cược
  ROLLING: 'rolling',   // Đang lắc xúc xắc (3-5s)
  FINISHED: 'finished', // Kết thúc ván
};

const BAUCUA_MODE = {
  PURE_RANDOM: 'pure_random',   // Chế độ 1: Ngẫu nhiên hoàn toàn
  SAVE_USER: 'save_user',       // Chế độ 2: Thả mồi / Cứu trợ
  SWEEP_216: 'sweep_216',       // Chế độ 3: Quét 216 tổ hợp
};

const BAUCUA_LIMITS = {
  MIN_BET: 1000,                  // Tiền cược tối thiểu (1,000đ)
  MAX_BET: 500000,                // Tiền cược tối đa mỗi ô (500,000đ)
  BOT_COUNT_MIN: 5,               // Số lượng bot tối thiểu tham gia đặt cược ảo
  BOT_COUNT_MAX: 10,              // Số lượng bot tối đa tham gia đặt cược ảo
  WAITING_SECONDS: 15,            // Thời gian đếm ngược để người chơi đặt cược (15 giây)
  ROLLING_SECONDS: 4,             // Thời gian lắc xúc xắc và chạy hoạt ảnh (4 giây)
  RESULT_DISPLAY_SECONDS: 3,      // Thời gian hiển thị kết quả xúc xắc trước khi sang ván mới (3 giây)
  LOW_BET_THRESHOLD: 100000,     // Tổng tiền cược dưới ngưỡng này sẽ chạy chế độ Ngẫu nhiên hoàn toàn (Mode 1)
  LOW_USER_THRESHOLD: 2,         // Số lượng user dưới ngưỡng này sẽ chạy chế độ Ngẫu nhiên hoàn toàn (Mode 1)
  SAVE_USER_STREAK: 3,           // User thua liên tiếp quá số ván này sẽ được kích hoạt cơ chế Thả mồi/Cứu trợ (Mode 2)
};

// Đố Vui Sinh Tồn (Trivia Battle Royale) constants
const TRIVIA_LIMITS = {
  MIN_PLAYERS: 2,                 // Số lượng người chơi tối thiểu để bắt đầu trận đấu (2 người)
  MAX_PLAYERS: 10,                // Số lượng người chơi tối đa trong một phòng đấu (10 người)
  STARTING_HP: 100,               // Lượng máu (HP) ban đầu của mỗi người chơi (100 HP)
  QUESTIONS_PER_GAME: 10,         // Số lượng câu hỏi mặc định của mỗi trận đấu (10 câu)
  MIN_QUESTIONS_REQUIRED: 5,      // Số lượng câu hỏi tối thiểu của đề tài để được phép bắt đầu chơi (5 câu)
  QUESTION_SECONDS: 5,            // Thời gian đếm ngược để trả lời mỗi câu hỏi (5 giây)
  RESULT_DISPLAY_SECONDS: 3,      // Thời gian hiển thị kết quả và đáp án đúng của câu hỏi hiện tại (5 giây)
  DAMAGE_SHIELD: 0,               // Sát thương khi trả lời ĐÚNG và NHANH NHẤT (0 sát thương - nhận khiên)
  DAMAGE_SLOW: 5,                 // Sát thương khi trả lời ĐÚNG nhưng CHẬM hơn người nhanh nhất (bị trừ 5 HP)
  DAMAGE_WRONG: 15,               // Sát thương khi trả lời SAI hoặc không trả lời/AFK (bị trừ 15 HP)
};

const TRIVIA_PLAYER_STATUS = {
  ALIVE: 'alive',
  SPECTATOR: 'spectator',
};

const TRIVIA_ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

module.exports = { 
  ORDER_STATUS, 
  PRODUCT_TYPES, 
  USER_ROLES, 
  PAGINATION,
  DEPOSIT_STATUS,
  TRANSACTION_TYPES,
  BAUCUA_SYMBOLS,
  BAUCUA_SYMBOL_LABELS,
  BAUCUA_STATUS,
  BAUCUA_MODE,
  BAUCUA_LIMITS,
  TRIVIA_LIMITS,
  TRIVIA_PLAYER_STATUS,
  TRIVIA_ROOM_STATUS,
};
