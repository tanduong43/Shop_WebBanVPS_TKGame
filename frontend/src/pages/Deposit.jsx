// src/pages/Deposit.jsx - Trang nạp tiền VietQR/PayOS của User
import { useState, useEffect, useRef } from 'react';
import { depositAPI } from '../services/api';
import useSocket from '../context/SocketContext';
import { toast } from 'react-toastify';
import {
  FiDollarSign, FiCopy, FiCheck, FiRefreshCw, FiClock,
  FiArrowRight, FiCheckCircle, FiInfo, FiTrendingUp
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const PRESETS = [20000, 50000, 100000, 200000, 500000, 1000000];

export default function Deposit() {
  const { user } = useAuth();
  const socket = useSocket();

  const [step, setStep] = useState('input'); // 'input' | 'payment' | 'success'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDeposit, setCurrentDeposit] = useState(null);
  
  // Lịch sử nạp tiền
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Trạng thái sao chép (copy)
  const [copiedField, setCopiedField] = useState('');
  // Đếm ngược thời gian (30 phút = 1800 giây)
  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);

  // Load lịch sử nạp
  const fetchHistory = async (p = 1) => {
    setHistoryLoading(true);
    try {
      const res = await depositAPI.getMyList({ page: p, limit: 5 });
      setHistory(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  // Lắng nghe sự kiện chuyển khoản realtime qua Socket.IO
  useEffect(() => {
    if (!socket || !currentDeposit) return;

    const handleDepositCompleted = (data) => {
      if (Number(data.orderCode) === Number(currentDeposit.orderCode)) {
        setStep('success');
        fetchHistory(1);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    socket.on('deposit:completed', handleDepositCompleted);

    return () => {
      socket.off('deposit:completed', handleDepositCompleted);
    };
  }, [socket, currentDeposit]);

  // Bộ đếm ngược thời gian nạp
  useEffect(() => {
    if (step === 'payment' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setStep('input');
            toast.warn('Đơn nạp tiền đã hết hạn thanh toán');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    const numAmount = parseInt(amount);

    if (!numAmount || isNaN(numAmount) || numAmount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000 VNĐ');
      return;
    }

    setLoading(true);
    try {
      const res = await depositAPI.create(numAmount);
      setCurrentDeposit(res.data.data);
      setTimeLeft(1800); // 30 mins
      setStep('payment');
      toast.success('Tạo yêu cầu nạp tiền thành công! Vui lòng chuyển khoản.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo đơn nạp tiền');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container max-w-4xl animate-slide-up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: GIAO DIỆN CHÍNH (NẠP TIỀN / QR) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* ── STEP 1: NHẬP SỐ TIỀN ── */}
            {step === 'input' && (
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
                <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <FiDollarSign className="text-primary-400" /> Nạp Tiền Vào Ví
                </h1>
                <p className="text-white/40 text-xs mb-6">
                  Số dư hiện tại: <span className="text-green-400 font-bold">{formatMoney(user?.balance || 0)}</span>. Quét mã QR chuyển khoản ngân hàng cộng tiền tự động.
                </p>

                <form onSubmit={handleCreateDeposit} className="space-y-6">
                  {/* Nhập số tiền */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Số tiền muốn nạp (VNĐ)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Nhập số tiền nạp, ví dụ: 50000"
                        className="input-field pl-5 pr-16 text-lg font-bold text-white placeholder-white/20"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30">VNĐ</span>
                    </div>
                  </div>

                  {/*Presets gợi ý */}
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmount(p.toString())}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                          parseInt(amount) === p
                            ? 'bg-primary-500/20 text-primary-400 border-primary-500/50 shadow-glow-primary/20'
                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {p.toLocaleString('vi-VN')}
                      </button>
                    ))}
                  </div>

                  {/* Nút gửi */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-4 hover:shadow-glow-primary"
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin" /> Đang khởi tạo...
                      </>
                    ) : (
                      <>
                        Tiếp Tục <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── STEP 2: HIỂN THỊ VIETQR THANH TOÁN ── */}
            {step === 'payment' && currentDeposit && (
              <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500 animate-pulse" />
                
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-white">Chuyển Khoản Ngân Hàng</h2>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold">
                    <FiClock className="animate-spin-slow" /> {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Cột trái: Mã QR */}
                  <div className="w-48 sm:w-56 p-3 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl relative group select-none">
                    <img 
                      src={currentDeposit.qrCode} 
                      alt="VietQR code" 
                      className="w-full h-auto rounded-lg object-contain"
                    />
                    <div className="mt-2 text-[9px] font-extrabold text-slate-800 uppercase tracking-widest text-center flex items-center gap-1 justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" /> VIETQR QUÉT ĐỂ BẮT ĐẦU
                    </div>
                  </div>

                  {/* Cột phải: Thông tin chuyển khoản */}
                  <div className="flex-1 w-full space-y-4">
                    {/* Ngân hàng */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Ngân hàng thụ hưởng</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-bold text-white">
                          {currentDeposit.bankInfo?.bankId || 'MBBank'}
                        </p>
                        <span className="text-[10px] text-white/50 px-2 py-0.5 rounded bg-white/5 uppercase">Hỗ trợ 24/7</span>
                      </div>
                    </div>

                    {/* Số tài khoản */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 relative">
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Số tài khoản nhận</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-mono font-extrabold text-primary-400 select-all">
                          {currentDeposit.bankInfo?.bankAccount}
                        </p>
                        <button
                          onClick={() => handleCopy(currentDeposit.bankInfo?.bankAccount, 'stk')}
                          className="text-white/40 hover:text-white p-1"
                        >
                          {copiedField === 'stk' ? <FiCheck className="text-green-400" /> : <FiCopy />}
                        </button>
                      </div>
                    </div>

                    {/* Tên chủ TK */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Chủ tài khoản</p>
                      <p className="text-sm font-bold text-white mt-1 uppercase">
                        {currentDeposit.bankInfo?.bankOwner}
                      </p>
                    </div>

                    {/* Số tiền */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase font-semibold">Số tiền cần chuyển</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-extrabold text-green-400">
                          {formatMoney(currentDeposit.amount)}
                        </p>
                        <button
                          onClick={() => handleCopy(currentDeposit.amount.toString(), 'amount')}
                          className="text-white/40 hover:text-white p-1"
                        >
                          {copiedField === 'amount' ? <FiCheck className="text-green-400" /> : <FiCopy />}
                        </button>
                      </div>
                    </div>

                    {/* Nội dung ck */}
                    <div className="bg-gradient-to-r from-primary-500/10 to-transparent rounded-xl p-3 border border-primary-500/20">
                      <p className="text-[10px] text-primary-400 uppercase font-bold tracking-wider">Nội dung chuyển khoản (Bắt buộc đúng 100%)</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-mono font-black text-white bg-black/30 px-3 py-1 rounded-md border border-white/10 select-all">
                          {currentDeposit.transferContent}
                        </p>
                        <button
                          onClick={() => handleCopy(currentDeposit.transferContent, 'content')}
                          className="text-primary-400 hover:text-primary-300 p-1.5 bg-primary-500/10 rounded-lg"
                        >
                          {copiedField === 'content' ? <FiCheck className="text-green-400" /> : <FiCopy />}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Hướng dẫn an toàn */}
                <div className="mt-6 flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-white/50">
                  <FiInfo className="text-lg text-primary-400 flex-shrink-0" />
                  <p>
                    <strong>Lưu ý:</strong> Hãy quét mã QR hoặc copy chuẩn xác nội dung chuyển khoản <span className="text-primary-400 font-bold">{currentDeposit.transferContent}</span>. Hệ thống sẽ tự động khớp lệnh cộng tiền sau 15-30 giây khi tài khoản của chúng tôi nhận được tiền.
                  </p>
                </div>

                {/* Trạng thái loading chờ tiền */}
                <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-white/60 font-semibold animate-pulse">Đang chờ hệ thống ngân hàng xác nhận...</p>
                  </div>
                  <button
                    onClick={() => {
                      if (timerRef.current) clearInterval(timerRef.current);
                      setStep('input');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all text-center"
                  >
                    Hủy lệnh & Tạo lại
                  </button>
                </div>

              </div>
            )}

            {/* ── STEP 3: NẠP TIỀN THÀNH CÔNG ── */}
            {step === 'success' && currentDeposit && (
              <div className="glass-card p-8 text-center relative overflow-hidden py-12">
                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6 text-green-400 text-3xl shadow-glow-primary">
                  <FiCheckCircle />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Nạp Tiền Thành Công!</h2>
                <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                  Giao dịch chuyển khoản của bạn đã được đối soát tự động hoàn tất. Số tiền đã được cộng trực tiếp vào ví của bạn.
                </p>

                <div className="max-w-xs mx-auto bg-white/5 rounded-2xl p-5 border border-white/5 mb-8 space-y-3">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Mã đơn hàng</span>
                    <span className="font-mono text-white">#{currentDeposit.orderCode}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Số tiền nạp</span>
                    <span className="font-bold text-green-400">+{formatMoney(currentDeposit.amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Trạng thái ví</span>
                    <span className="text-primary-400 font-bold">Đã cộng số dư</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAmount('');
                    setStep('input');
                  }}
                  className="btn-primary py-3 px-8 text-xs font-bold"
                >
                  Nạp thêm đơn khác
                </button>
              </div>
            )}

          </div>

          {/* CỘT PHẢI: LỊCH SỬ NẠP GẦN ĐÂY */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6">
              <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <FiTrendingUp className="text-green-400" /> Lịch sử nạp tiền
              </h2>

              {historyLoading ? (
                <div className="space-y-3 py-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-xs">
                  Chưa có lịch sử giao dịch nạp tiền.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div
                      key={h._id}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white/60">#{h.orderCode}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            h.status === 'completed' ? 'bg-green-500/10 text-green-400'
                            : h.status === 'cancelled' ? 'bg-red-500/10 text-red-400'
                            : h.status === 'expired' ? 'bg-white/10 text-white/40'
                            : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {h.status === 'completed' ? 'Thành công'
                              : h.status === 'cancelled' ? 'Đã hủy'
                              : h.status === 'expired' ? 'Hết hạn'
                              : 'Chờ thanh toán'}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40">{new Date(h.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <p className="text-xs font-mono font-black text-white">
                        {formatMoney(h.amount)}
                      </p>
                    </div>
                  ))}

                  {/* Phân trang lịch sử */}
                  {totalPages > 1 && (
                    <div className="pt-2">
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(p) => fetchHistory(p)}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
