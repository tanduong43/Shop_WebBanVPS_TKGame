// src/pages/Orders.jsx - Lịch sử đơn hàng của user
import { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import { FiPackage, FiClock, FiCheck, FiX, FiRefreshCw, FiMessageCircle } from 'react-icons/fi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));

const STATUS_CONFIG = {
  pending_contact: { label: 'Chờ xử lý', icon: FiClock,   className: 'badge-pending' },
  completed:       { label: 'Hoàn thành',  icon: FiCheck,   className: 'badge-completed' },
  cancelled:       { label: 'Đã hủy',      icon: FiX,       className: 'badge-cancelled' },
};

const SkeletonOrder = () => (
  <div className="glass-card p-5 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton h-6 w-24 rounded-full" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
    </div>
    <div className="flex justify-between">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-6 w-32 rounded" />
    </div>
  </div>
);

const Orders = () => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await orderAPI.getMyOrders({ page, limit: 10 });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(currentPage); }, [currentPage]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="section-container max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FiPackage className="text-primary-400" /> Quản Lý Dịch Vụ & Đơn Hàng
            </h1>
            <p className="text-white/50 mt-1">{pagination.total} mục</p>
          </div>
          <button onClick={() => fetchOrders(currentPage)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <SkeletonOrder key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <FiPackage className="text-6xl text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Chưa có đơn hàng</h3>
            <p className="text-white/50">Mua sắm ngay và theo dõi đơn hàng tại đây!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => <OrderCard key={order._id} order={order} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                  currentPage === i + 1
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_contact;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div
        className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-white/40 text-xs font-mono">#{order._id.slice(-8).toUpperCase()}</span>
            <span className={statusCfg.className}>
              <StatusIcon className="mr-1 text-xs" /> {statusCfg.label}
            </span>
          </div>
          <p className="text-white/50 text-xs">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs mb-0.5">{order.items.length} sản phẩm</p>
          <p className="text-lg font-bold gradient-text">{formatPrice(order.totalPrice)}</p>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-3 animate-fade-in">
          {order.items.map((item, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-white font-semibold">{item.name} <span className="text-white/30 text-xs">×{item.quantity}</span></span>
                  <div className="text-xs text-white/50 mt-1 uppercase tracking-widest">{item.type === 'vps' ? 'Dịch vụ VPS' : item.type === 'game_account' ? 'Tài khoản Game' : 'Dịch vụ'}</div>
                </div>
                <span className="text-primary-400 font-bold">{formatPrice(item.price * item.quantity)}</span>
              </div>

              {/* Service Config Snapshot */}
              {(item.vpsInfo || item.accountInfo) && (
                <div className="flex flex-col gap-2 mt-2">
                  {item.type === 'vps' && item.vpsInfo && (
                    <>
                      <div className="text-xs text-white/40">Hệ điều hành: <span className="text-white/80">{item.vpsInfo.os || 'N/A'}</span></div>
                      <div className="text-xs text-white/40">CPU: <span className="text-white/80">{item.vpsInfo.cpu || 'N/A'}</span></div>
                      <div className="text-xs text-white/40">RAM: <span className="text-white/80">{item.vpsInfo.ram || 'N/A'}</span></div>
                      <div className="text-xs text-white/40">Ổ cứng: <span className="text-white/80">{item.vpsInfo.storage || 'N/A'}</span></div>
                    </>
                  )}
                  {item.type === 'game_account' && item.accountInfo && (
                    <>
                      <div className="text-xs text-white/40">Server: <span className="text-white/80">{item.accountInfo.server || 'N/A'}</span></div>
                      <div className="text-xs text-white/40">Level: <span className="text-white/80">{item.accountInfo.level || '0'}</span></div>
                    </>
                  )}
                </div>
              )}

              {/* Credentials Section if Completed */}
              {order.status === 'completed' && item.credentials && (item.credentials.ip || item.credentials.username || item.credentials.password || item.credentials.server) && (
                <div className="mt-3 bg-dark-900/50 rounded-lg p-3 border border-primary-500/20">
                  <h4 className="text-xs font-bold text-primary-400 mb-2 uppercase tracking-widest">Thông tin cấp phát</h4>
                  <div className="space-y-1.5">
                    {item.credentials.ip && <div className="flex items-center text-sm"><span className="text-white/50 w-32 shrink-0">IP/Host:</span> <span className="font-mono text-white select-all">{item.credentials.ip}</span></div>}
                    {item.credentials.username && <div className="flex items-center text-sm"><span className="text-white/50 w-32 shrink-0">Tài khoản:</span> <span className="font-mono text-white font-bold select-all">{item.credentials.username}</span></div>}
                    {item.credentials.password && <div className="flex items-center text-sm"><span className="text-white/50 w-32 shrink-0">Mật khẩu:</span> <span className="font-mono text-white font-bold select-all">{item.credentials.password}</span></div>}
                    {item.credentials.server && <div className="flex items-center text-sm"><span className="text-white/50 w-32 shrink-0">Server Game:</span> <span className="font-mono text-white">{item.credentials.server}</span></div>}
                    
                    {item.type === 'vps' && (
                      <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                        <div className="flex items-center text-sm"><span className="text-white/50 w-32 shrink-0">Ngày kích hoạt:</span> <span className="text-white/80">{item.credentials.createdAt ? formatDate(item.credentials.createdAt) : 'N/A'}</span></div>
                        <div className="flex items-center text-sm"><span className="text-white/50 w-32 shrink-0">Chu kỳ:</span> <span className="text-white/80">{item.credentials.cycle || '1 Tháng'}</span></div>
                        <div className="flex items-center text-sm">
                          <span className="text-white/50 w-32 shrink-0">Ngày hết hạn:</span> 
                          <span className={`font-semibold ${
                            item.credentials.expiresAt && new Date(item.credentials.expiresAt) < new Date() 
                              ? 'text-red-400' 
                              : item.credentials.expiresAt && new Date(item.credentials.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? 'text-amber-400'
                                : 'text-green-400'
                          }`}>
                            {item.credentials.expiresAt ? formatDate(item.credentials.expiresAt) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
