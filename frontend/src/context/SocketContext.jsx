// src/context/SocketContext.jsx - Quản lý kết nối Socket.IO realtime ở Frontend
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, updateBalance } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Khởi tạo kết nối socket.io client
    const socketClient = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketClient.on('connect', () => {
      console.log('⚡ Socket.IO connected successfully');
    });

    socketClient.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    // Lắng nghe sự kiện cập nhật số dư chung
    socketClient.on('balance:updated', (data) => {
      if (data && typeof data.balance === 'number') {
        updateBalance(data.balance);
        if (data.message) {
          toast.info(data.message, { icon: '💰' });
        }
      }
    });

    // Lắng nghe sự kiện nạp tiền thành công (realtime)
    socketClient.on('deposit:completed', (data) => {
      if (data) {
        // Cập nhật số dư
        updateBalance(data.balance);
        
        // Hiệu ứng pháo hoa giấy ăn mừng rực rỡ
        try {
          confetti({
            particleCount: 180,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
          });
        } catch (e) {
          console.error('Confetti error:', e);
        }

        // Bắn Toast thông báo premium
        toast.success(
          <div>
            <p className="font-bold text-white text-sm">Nạp Tiền Thành Công! 🎉</p>
            <p className="text-xs text-white/80">Số tiền: <span className="font-semibold text-green-400">+{data.amount.toLocaleString('vi-VN')} VNĐ</span></p>
            <p className="text-[10px] text-white/50">Đơn hàng: #{data.orderCode}</p>
          </div>,
          {
            position: 'top-center',
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'dark',
          }
        );
      }
    });

    // Lắng nghe sự kiện lệnh nạp bị hủy bởi Admin
    socketClient.on('deposit:cancelled', (data) => {
      if (data) {
        toast.warn(data.message || 'Lệnh nạp tiền của bạn đã bị từ chối/hủy.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    });

    setSocket(socketClient);

    // Dọn dẹp kết nối khi unmount
    return () => {
      socketClient.off('connect');
      socketClient.off('connect_error');
      socketClient.off('balance:updated');
      socketClient.off('deposit:completed');
      socketClient.off('deposit:cancelled');
      socketClient.disconnect();
    };
  }, [isAuthenticated, token, updateBalance]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook để sử dụng socket ở mọi nơi
const useSocket = () => {
  return useContext(SocketContext);
};

export default useSocket;
