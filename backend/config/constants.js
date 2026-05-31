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
  MIN_BET: 1000,
  MAX_BET: 500000,
  BOT_COUNT_MIN: 5,
  BOT_COUNT_MAX: 10,
  WAITING_SECONDS: 15,
  ROLLING_SECONDS: 4,
  RESULT_DISPLAY_SECONDS: 5,
  LOW_BET_THRESHOLD: 100000,   // Ngưỡng tiền cược thấp (Mode 1)
  LOW_USER_THRESHOLD: 2,       // Số user thực thấp (Mode 1)
  SAVE_USER_STREAK: 3,         // Thua liên tiếp (Mode 2)
};

// Đố Vui Sinh Tồn (Trivia Battle Royale) constants
const TRIVIA_LIMITS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  STARTING_HP: 100,
  QUESTIONS_PER_GAME: 10,
  MIN_QUESTIONS_REQUIRED: 5,
  QUESTION_SECONDS: 10,
  RESULT_DISPLAY_SECONDS: 3,
  DAMAGE_SHIELD: 0,
  DAMAGE_SLOW: 5,
  DAMAGE_WRONG: 15,
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
