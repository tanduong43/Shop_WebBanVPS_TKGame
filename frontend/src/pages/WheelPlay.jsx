// src/pages/WheelPlay.jsx - Giao diện trang chơi Vòng quay may mắn dành cho User
import { useState, useEffect, useRef, useCallback } from 'react';
import { wheelAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import spinSoundPath from '../assets/audio/spin.mp3';
import winSoundPath from '../assets/audio/win.mp3';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import {
  FiAward, FiZap, FiRefreshCw, FiInfo, FiVolume2, FiVolumeX
} from 'react-icons/fi';

export default function WheelPlay() {
  const { user, updateBalance } = useAuth();

  const [wheels, setWheels] = useState([]);
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Canvas ref
  const canvasRef = useRef(null);

  // Lịch sử quay cá nhân
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Popup trúng giải
  const [showWinModal, setShowWinModal] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);

  // Animation variables
  const animationRef = useRef(null);
  const angleRef = useRef(0);

  // Phát âm thanh quay bằng Audio HTML5
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(spinSoundPath);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch (e) {
      console.warn('Audio play failed:', e.message);
    }
  };

  // Phát âm thanh chiến thắng bằng Audio HTML5
  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(winSoundPath);
      audio.volume = 0.8;
      audio.play().catch(e => console.warn(e));
    } catch (e) {
      console.warn('Audio play failed:', e.message);
    }
  };

  // 1. Tải toàn bộ danh sách vòng quay hoạt động
  const fetchWheels = async () => {
    setLoading(true);
    try {
      const res = await wheelAPI.getAll();
      setWheels(res.data.data);
      if (res.data.data.length > 0) {
        // Tự chọn vòng quay đầu tiên
        fetchWheelDetails(res.data.data[0]._id);
      }
    } catch (err) {
      toast.error('Không thể lấy danh sách vòng quay');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Tải chi tiết vòng quay & phần quà
  const fetchWheelDetails = async (id) => {
    try {
      const res = await wheelAPI.getDetail(id);
      setSelectedWheel(res.data.data.wheel);
      setPrizes(res.data.data.prizes);
      angleRef.current = 0; // reset góc
    } catch (err) {
      toast.error('Không thể lấy chi tiết vòng quay');
      console.error(err);
    }
  };

  // 3. Lấy lịch sử quay cá nhân
  const fetchHistory = async (p = 1) => {
    setHistoryLoading(true);
    try {
      const res = await wheelAPI.getMyHistory({ page: p, limit: 10 });
      if (p === 1) {
        setHistory(res.data.data);
      } else {
        setHistory(prev => [...prev, ...res.data.data]);
      }
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchWheels();
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi mount
  }, []);

  // 4. Vẽ vòng quay lên Canvas khi thay đổi phần thưởng
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    const segmentAngle = (2 * Math.PI) / prizes.length;
    const currentAngle = angleRef.current;

    // Lưu trạng thái trước khi xoay canvas
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    // Vẽ các phân đoạn vòng quay
    prizes.forEach((prize, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Vẽ hình quạt phân đoạn
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Tô màu phân đoạn
      ctx.fillStyle = prize.color || '#3b82f6';
      ctx.fill();

      // Viền màu phân đoạn để tách biệt sang chảnh
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.stroke();

      // Vẽ chữ nhãn phần thưởng
      ctx.save();
      // Xoay tới tâm điểm của góc phân đoạn đó
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Màu chữ nổi bật
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';

      // Rút ngắn text dài
      let text = prize.name;
      if (text.length > 18) text = text.slice(0, 16) + '...';

      // Vẽ chữ chạy dọc theo bán kính hướng vào tâm
      ctx.fillText(text, radius - 20, 0);
      ctx.restore();
    });

    ctx.restore();

    // ── VẼ KHUNG VIỀN NGOÀI & CHẤM TRANG TRÍ (OUTER BORDER) ──
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1e1b4b'; // Xanh tím đậm
    ctx.stroke();

    // Viền neon phát sáng
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#4f46e5'; // Xanh indigo neon
    ctx.stroke();

    // Vẽ các chấm tròn nhỏ chạy quanh viền phát sáng (Chấm đèn led)
    const ledCount = 24;
    for (let i = 0; i < ledCount; i++) {
      const angle = (i * 2 * Math.PI) / ledCount;
      const ledX = centerX + (radius + 1) * Math.cos(angle);
      const ledY = centerY + (radius + 1) * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(ledX, ledY, 3, 0, 2 * Math.PI);

      // Tạo hiệu ứng đèn chớp nháy bằng cách luân phiên màu theo thời gian
      const isEven = i % 2 === 0;
      const isLit = Math.floor(Date.now() / 300) % 2 === 0;

      ctx.fillStyle = isLit ? (isEven ? '#f59e0b' : '#38bdf8') : (isEven ? '#38bdf8' : '#ec4899');
      ctx.fill();
    }

    // ── VẼ TÂM TRÒN VÒNG QUAY (CENTER PEG) ──
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1b4b';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#4f46e5';
    ctx.fill();
    ctx.shadowBlur = 0; // Tắt shadow

    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0, 2 * Math.PI);
    // Gradient vàng óng choPeg giữa
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 16);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = grad;
    ctx.fill();

    // Chữ SPIN ở giữa vòng quay
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN', centerX, centerY);
  }, [prizes]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // 5. THỰC HIỆN LOGIC QUAY THƯỞNG
  const handleSpin = async () => {
    if (spinning || !selectedWheel || prizes.length === 0) return;

    if (user.balance < selectedWheel.price) {
      toast.error('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền!');
      return;
    }

    setSpinning(true);

    try {
      // 1. Gọi API Backend quyết định ngẫu nhiên weighted random
      const res = await wheelAPI.spin(selectedWheel._id);
      const { prize, segmentIndex, newBalance } = res.data.data;

      // 2. Tính toán góc quay đích chính xác
      const segmentAngle = (2 * Math.PI) / prizes.length;

      // Vị trí kim chỉ ở đỉnh (góc 12 giờ tức là 270 độ = 1.5 * PI)
      // Góc quay đích để ô segmentIndex dừng chính xác tại đỉnh:
      // rotationAngle = 1.5 * PI - (tâm của ô trúng thưởng)
      const centerAngleOfWinner = (segmentIndex + 0.5) * segmentAngle;
      const targetAngle = 1.5 * Math.PI - centerAngleOfWinner;

      // Thực hiện xoay 8-10 vòng lớn trước khi dừng để tạo kịch tính
      const extraLaps = 8 + Math.floor(Math.random() * 4);
      const finalAngle = extraLaps * 2 * Math.PI + targetAngle;

      const duration = 5000; // Thời gian quay: 5 giây
      const startTime = performance.now();
      const initialAngle = angleRef.current % (2 * Math.PI);

      let lastSegmentIndex = -1;

      // 3. VÒNG LẶP ANIMATION (CUBIC EASE-OUT CHẠY MƯỢT MÀ)
      const animateSpin = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Hàm cubic ease-out: giảm tốc mượt mà về cuối
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const currentProgress = easeOut(progress);

        // Góc xoay hiện tại
        const angle = initialAngle + currentProgress * (finalAngle - initialAngle);
        angleRef.current = angle;

        // Vẽ lại vòng quay
        drawWheel();

        // 🔊 XỬ LÝ PHÁT TIẾNG TÍCH TÍCH REALTIME KHI ĐÈN LED/KIM TRƯỢT QUA CÁC Ô
        // Tính toán ô hiện tại đang ở vị trí kim chỉ (đỉnh 12 giờ)
        // needleAngle = 1.5 * PI
        const needleAngle = 1.5 * Math.PI;
        const normalizedAngle = (needleAngle - angle) % (2 * Math.PI);
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
        const currentSegment = Math.floor(positiveAngle / segmentAngle) % prizes.length;

        if (currentSegment !== lastSegmentIndex && progress < 0.98) {
          playTickSound();
          lastSegmentIndex = currentSegment;
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateSpin);
        } else {
          // 4. ANIMATION KẾT THÚC THÀNH CÔNG
          setSpinning(false);
          setWonPrize(prize);
          setShowWinModal(true);

          // Kích hoạt pháo hoa
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
          });

          // Phát nhạc arpeggio chiến thắng
          playWinSound();

          // Cập nhật số dư realtime lên Navbar
          updateBalance(newBalance);

          // Làm mới lịch sử quay
          fetchHistory(1);
        }
      };

      animationRef.current = requestAnimationFrame(animateSpin);

    } catch (err) {
      setSpinning(false);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện quay thưởng');
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      {/* BG Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container max-w-[1080px] animate-slide-up">

        {/* THANH THIẾT LẬP NHANH */}
        <div className="flex justify-between items-center mb-6 bg-white/5 border border-white/5 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <FiAward className="text-primary-400 text-lg" />
            <span className="text-xs text-white/50">Cơ hội nhận VPS khủng & Code VIP</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs"
          >
            {soundEnabled ? (
              <><FiVolume2 className="text-green-400" /> Bật âm thanh</>
            ) : (
              <><FiVolumeX className="text-white/40" /> Tắt âm thanh</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* CỘT TRÁI: DANH SÁCH GÓI VÀ GIỚI THIỆU */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2">Chọn gói vòng quay</h2>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="skeleton h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : wheels.length === 0 ? (
              <p className="text-white/30 text-xs">Hiện tại không có vòng quay nào đang mở</p>
            ) : (
              wheels.map((w) => (
                <button
                  key={w._id}
                  onClick={() => {
                    if (spinning) return;
                    fetchWheelDetails(w._id);
                  }}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col gap-2 group ${selectedWheel?._id === w._id
                    ? 'bg-primary-500/10 border-primary-500/40 shadow-glow-primary/20'
                    : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
                    }`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-black text-white">{w.name}</span>
                    <span className="text-xs font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20">
                      {w.price.toLocaleString()}đ / lượt
                    </span>
                  </div>

                  <p className="text-[11px] text-white/40 leading-relaxed font-normal">{w.description}</p>
                </button>
              ))
            )}
          </div>

          {/* CỘT GIỮA: KHU VỰC VÒNG QUAY MAY MẮN */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">

            {/* KHUNG VÒNG QUAY CANVAS VÀ KIM CHỈ */}
            <div className="relative p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center">

              {/* KIM CHỈ VÒNG QUAY (NEEDLE PIN Ở ĐỈNH 12 GIỜ CHỈ XUỐNG) */}
              <div className="absolute top-2.5 z-10 w-8 h-8 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M15 28L3 6C3 6 8.5 2 15 2C21.5 2 27 6 27 6L15 28Z" fill="#ff4757" />
                  <path d="M15 20L8 6C8 6 11.5 4 15 4C18.5 4 22 6 22 6L15 20Z" fill="#ff6b81" />
                  <circle cx="15" cy="6" r="3" fill="#ffffff" />
                </svg>
              </div>

              {/* Vòng Quay */}
              <canvas
                ref={canvasRef}
                width={360}
                height={360}
                className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full drop-shadow-[0_10px_35px_rgba(79,70,229,0.25)] select-none pointer-events-none"
              />
            </div>

            {/* NÚT QUAY */}
            {selectedWheel && (
              <button
                onClick={handleSpin}
                disabled={spinning || prizes.length === 0}
                className="w-full max-w-xs btn-primary text-sm font-black py-4 rounded-2xl flex items-center justify-center gap-2 group shadow-glow-primary relative overflow-hidden transition-all duration-300 disabled:opacity-40"
              >
                {spinning ? (
                  <>
                    <FiRefreshCw className="animate-spin text-lg" /> Đang quay thưởng...
                  </>
                ) : (
                  <>
                    <FiZap className="text-yellow-400 text-lg group-hover:scale-125 transition-transform" />
                    BẮT ĐẦU QUAY ({selectedWheel.price.toLocaleString()}đ)
                  </>
                )}
              </button>
            )}

            {/* List cơ cấu giải thưởng đang có */}
            <div className="w-full text-center">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Danh sách phần quà vòng này:</span>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {prizes.map((p) => (
                  <span
                    key={p._id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1.5"
                    style={{ backgroundColor: `${p.color}10`, color: p.color, borderColor: `${p.color}30` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: LỊCH SỬ QUAY THÀNH CÔNG */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2">Lịch sử quay của bạn</h2>

            <div className="glass-card p-4 space-y-3">
              {historyLoading && page === 1 ? (
                <div className="space-y-2 py-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-white/30 text-xs py-8">Bạn chưa có lượt quay nào</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {history.map((h) => {
                    const isVpsOrGame = h.prizeId?.name?.toLowerCase().match(/vps|game|acc|tài khoản/);
                    return (
                      <div
                        key={h._id}
                        onClick={() => {
                          if (isVpsOrGame && h.prizeId) {
                            setWonPrize(h.prizeId);
                            setShowWinModal(true);
                          }
                        }}
                        className={`p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors text-[11px] ${isVpsOrGame ? 'cursor-pointer ring-1 ring-primary-500/30 hover:ring-primary-500 shadow-glow-primary/10' : ''}`}
                      >
                        <div className="flex-1">
                          <p className="text-white font-semibold truncate max-w-[160px]">
                            {h.prizeId?.name || 'Quà đã bị xóa'}
                          </p>
                          <p className="text-[9px] text-white/30">{new Date(h.createdAt).toLocaleDateString('vi-VN')} lúc {new Date(h.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          {isVpsOrGame && (
                            <p className="text-[9px] text-primary-400 mt-1 font-semibold flex items-center gap-1">
                              <FiInfo className="text-[10px]" /> Nhấn xem thông tin
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-white/40">-{h.price.toLocaleString()}đ</span>
                      </div>
                    );
                  })}

                  {page < totalPages && (
                    <button
                      onClick={() => fetchHistory(page + 1)}
                      disabled={historyLoading}
                      className="w-full py-2.5 mt-2 text-center text-[10px] font-bold text-white/50 hover:text-primary-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                    >
                      {historyLoading ? 'Đang tải...' : '👇 Lướt xem thêm'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── POPUP CHÚC MỪNG TRÚNG THƯỞNG ── */}
      {showWinModal && wonPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setShowWinModal(false)} />

          {/* Modal Container */}
          <div className="relative glass-card p-8 w-full max-w-sm text-center border-t-4 animate-scale-in" style={{ borderTopColor: wonPrize.color }}>

            {/* Pháo hoa giấy hình tròn */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-glow-primary border" style={{ backgroundColor: `${wonPrize.color}15`, color: wonPrize.color, borderColor: `${wonPrize.color}40` }}>
              🎉
            </div>

            <span className="text-[9px] font-black uppercase tracking-widest text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full">
              Chúc mừng chiến thắng
            </span>

            <h3 className="text-xl font-black text-white mt-4 mb-2">Bạn đã trúng phần quà:</h3>

            {/* Tên phần thưởng trúng */}
            <p className="text-2xl font-black tracking-wide drop-shadow-md select-all" style={{ color: wonPrize.color }}>
              {wonPrize.name}
            </p>

            {/* Mô tả giải */}
            <p className="text-xs text-white/40 leading-relaxed mt-3 mb-6 bg-white/5 p-3 rounded-xl border border-white/5">
              {wonPrize.description || 'Giải thưởng đã được ghi nhận trực tiếp vào số dư ví hoặc kho đồ của bạn.'}
            </p>

            <button
              onClick={() => setShowWinModal(false)}
              className="btn-primary w-full py-3 text-xs font-bold hover:shadow-glow-primary"
            >
              Cảm ơn, Quay tiếp thôi!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
