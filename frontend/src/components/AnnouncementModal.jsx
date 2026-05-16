import { useState, useEffect } from 'react';

const ANNOUNCEMENT = {
  title: '🎉 Chào mừng đến với DK Shop!',
  items: [
    // {
    //   icon: '🖥️',
    //   label: 'VPS Nat từ',
    //   value: '30.000đ/tháng',
    // },
    // {
    //   icon: '🌐',
    //   label: 'VPS IP Riêng từ',
    //   value: '67.000đ/tháng',
    // },
    // {
    //   icon: '🎮',
    //   label: 'Tài khoản game từ',
    //   value: '380.000đ',
    // },
    // {
    //   icon: '⚡',
    //   label: 'Băng thông',
    //   value: 'Không giới hạn',
    // },
    // {
    //   icon: '🛡️',
    //   label: 'Uptime',
    //   value: '99.9% – Ổn định 24/7',
    // },

    {
      icon: '💬',
      label: 'Hỗ trợ',
      value: 'Hệ thống có hỗ trợ dịch vụ đăng bán hộ account game. Khi thực hiện giao dịch, vui lòng liên hệ trực tiếp admin của game để được hỗ trợ và hạn chế rủi ro lừa đảo. Website sẽ không chịu trách nhiệm đối với các trường hợp người dùng bị scam hoặc phát sinh tranh chấp trong quá trình giao dịch.',
    },
    {
      icon: '💬',
      label: 'Hỗ trợ',
      value: 'Hiện tại một ip chỉ tạo được 3 tài khoản trong 1 ngày và chỉ đăng nhập được dưới 3 tài khoản',
    },
    {
      icon: '💬',
      label: 'Hỗ trợ',
      value: 'Qua Zalo – Nhanh chóng',
    },
  ],
  note: 'Liên hệ ngay để được tư vấn và nhận ưu đãi tốt nhất!',
  contactLabel: 'Zalo: 0978264349',
};

const COUNTDOWN_SECONDS = 5;
const STORAGE_KEY = 'dk_announcement_seen';

export default function AnnouncementModal() {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canClose, setCanClose] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Chỉ hiển thị 1 lần mỗi session
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (countdown <= 0) {
      setCanClose(true);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setCanClose(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, countdown]);

  const handleClose = () => {
    if (!canClose) return;
    setClosing(true);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  return (
    <div
      className={`announcement-overlay ${closing ? 'announcement-overlay--out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Thông báo chào mừng"
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) handleClose();
      }}
    >
      <div className={`announcement-modal ${closing ? 'announcement-modal--out' : ''}`}>
        {/* Header */}
        <div className="announcement-header">
          <div className="announcement-logo">DK</div>
          <h2 className="announcement-title">{ANNOUNCEMENT.title}</h2>
          <p className="announcement-subtitle">Dịch vụ VPS & Tài khoản Game uy tín – Giá rẻ – Chất lượng</p>
        </div>

        {/* Divider */}
        <div className="announcement-divider" />

        {/* Items grid */}
        <ul className="announcement-grid" aria-label="Dịch vụ nổi bật">
          {ANNOUNCEMENT.items.map((item, idx) => (
            <li key={idx} className="announcement-item">
              <span className="announcement-item-icon">{item.icon}</span>
              <div>
                <p className="announcement-item-label">{item.label}</p>
                <p className="announcement-item-value">{item.value}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Note */}
        <p className="announcement-note">{ANNOUNCEMENT.note}</p>
        <p className="announcement-contact">{ANNOUNCEMENT.contactLabel}</p>

        {/* Footer / close */}
        <div className="announcement-footer">
          {!canClose ? (
            <div className="announcement-countdown" aria-live="polite">
              <div
                className="announcement-progress"
                style={{ '--total': COUNTDOWN_SECONDS, '--left': countdown }}
              />
              <span>
                ⏳ Vui lòng đợi <strong>{countdown}</strong> giây…
              </span>
            </div>
          ) : (
            <button
              id="announcement-close-btn"
              className="announcement-close-btn"
              onClick={handleClose}
              autoFocus
            >
              ✓ Đã hiểu, vào trang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
