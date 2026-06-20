// src/pages/admin/Orders.jsx - Admin manage orders
import { useCallback, useEffect, useState } from 'react';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiSearch, FiSettings, FiX } from 'react-icons/fi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p || 0));

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'pending_contact', label: 'pending_contact' },
  { value: 'completed', label: 'completed' },
  { value: 'cancelled', label: 'cancelled' },
];

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  // Modal Xử lý đơn hàng
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAllOrders({ page, limit: 12, status });
      let list = res.data.data || [];
      // Simple client-side search
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        list = list.filter((o) =>
          o._id.toLowerCase().includes(needle) ||
          (o.userId?.username || '').toLowerCase().includes(needle) ||
          (o.userId?.email || '').toLowerCase().includes(needle)
        );
      }
      setItems(list);
      setPagination(res.data.pagination);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (orderId, nextStatus, itemsCredentials = null, sendEmail = false) => {
    setUpdatingId(orderId);
    try {
      const payload = { status: nextStatus };
      if (itemsCredentials) payload.itemsCredentials = itemsCredentials;
      if (sendEmail) payload.sendEmail = true;
      
      await orderAPI.updateStatus(orderId, payload);
      toast.success('Đã cập nhật trạng thái');
      setSelectedOrder(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Đơn hàng & Cấp phát</h1>
          <p className="text-white/40 text-sm mt-1">Xem đơn hàng và cấp phát dịch vụ cho User</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary py-2 px-4 text-sm inline-flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="glass-card p-4 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-11"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã đơn / username / email..."
          />
        </div>
        <select
          className="input-field lg:w-64 cursor-pointer"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} className="bg-dark-800">{s.label}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3">
              <tr className="text-left text-white/40">
                <th className="p-4">Mã</th>
                <th className="p-4">Khách</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4 text-right">Tổng</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}><td className="p-4" colSpan={6}><div className="skeleton h-8 w-full rounded-xl" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td className="p-6 text-white/40 text-center" colSpan={6}>Không có đơn hàng</td></tr>
              ) : (
                items.map((o) => (
                  <tr key={o._id} className="text-white/70">
                    <td className="p-4 font-mono text-xs text-white/50">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="p-4">
                      <p className="text-white">{o.userId?.username || '—'}</p>
                      <p className="text-white/40 text-xs">{o.userId?.email || ''}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white/70 text-xs">{o.items?.length || 0} items</p>
                      <p className="text-white/40 text-xs line-clamp-1">
                        {(o.items || []).map((it) => it.name).join(', ')}
                      </p>
                    </td>
                    <td className="p-4 text-right font-semibold">{formatPrice(o.totalPrice)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        o.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        o.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === 'pending_contact' ? (
                           <button 
                            onClick={() => setSelectedOrder(o)}
                            className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                           >
                             <FiSettings /> Xử lý cấp phát
                           </button>
                        ) : (
                          <>
                            {o.status === 'completed' && (
                              <button 
                                onClick={() => setSelectedOrder(o)}
                                className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                                title="Sửa thông tin cấp phát"
                              >
                                <FiSettings /> Sửa TT
                              </button>
                            )}
                            <select
                              className="input-field py-1.5 px-2 text-xs cursor-pointer w-auto"
                              value={o.status}
                              disabled={updatingId === o._id}
                              onChange={(e) => updateStatus(o._id, e.target.value)}
                            >
                              <option value="pending_contact" className="bg-dark-800">pending_contact</option>
                              <option value="completed" className="bg-dark-800">completed</option>
                              <option value="cancelled" className="bg-dark-800">cancelled</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between gap-3">
            <p className="text-white/40 text-xs">
              Trang {pagination.page} / {pagination.totalPages} • {pagination.total} đơn
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderProcessModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onSubmit={(credentials, sendEmail) => updateStatus(selectedOrder._id, 'completed', credentials, sendEmail)}
          isSubmitting={updatingId === selectedOrder._id}
        />
      )}
    </div>
  );
}

// Modal Cấp phát dịch vụ
function OrderProcessModal({ order, onClose, onSubmit, isSubmitting }) {
  // form state: array of credentials corresponding to order items
  const [formData, setFormData] = useState(() => {
    return order.items.map(item => ({
      itemId: item._id,
      type: item.type,
      name: item.name,
      userProvidedData: item.userProvidedData,
      credentials: {
        ip: item.credentials?.ip || '',
        username: item.credentials?.username || (item.type === 'vps' ? 'Administrator' : ''),
        password: item.credentials?.password || '',
        server: item.credentials?.server || '',
        expiresAt: item.credentials?.expiresAt ? new Date(item.credentials.expiresAt).toISOString().split('T')[0] : '',
        cycle: item.credentials?.cycle || '1 Tháng'
      }
    }));
  });
  
  const [sendEmail, setSendEmail] = useState(true);

  const handleChange = (index, field, value) => {
    const newData = [...formData];
    newData[index].credentials[field] = value;
    
    // Tự động tính ngày hết hạn nếu đổi chu kỳ
    if (field === 'cycle') {
      let daysToAdd = 0;
      const lowerValue = value.toLowerCase();
      
      if (lowerValue.includes('tuần')) {
        const match = lowerValue.match(/(\d+)\s*tuần/);
        if (match) daysToAdd = parseInt(match[1]) * 7;
      } else if (lowerValue.includes('tháng')) {
        const match = lowerValue.match(/(\d+)\s*tháng/);
        if (match) daysToAdd = parseInt(match[1]) * 30;
      } else if (lowerValue.includes('năm')) {
        const match = lowerValue.match(/(\d+)\s*năm/);
        if (match) daysToAdd = parseInt(match[1]) * 365;
      } else if (lowerValue.includes('ngày')) {
        const match = lowerValue.match(/(\d+)\s*ngày/);
        if (match) daysToAdd = parseInt(match[1]);
      }

      if (daysToAdd > 0) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + daysToAdd);
        newData[index].credentials.expiresAt = expireDate.toISOString().split('T')[0];
      }
    }
    
    setFormData(newData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, sendEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">
              {order.status === 'completed' ? 'Sửa thông tin cấp phát' : 'Xử lý & Cấp phát dịch vụ'}
            </h2>
            <p className="text-white/50 text-xs mt-1">Mã đơn: #{order._id.slice(-8).toUpperCase()} - Khách: {order.userId?.username}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {formData.map((item, index) => (
            <div key={item.itemId} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="mb-4 pb-2 border-b border-white/10">
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                  item.type === 'vps' ? 'bg-primary-500/20 text-primary-400' : 
                  item.type === 'game_account' ? 'bg-red-500/20 text-red-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {item.type === 'vps' ? 'VPS' : item.type === 'game_account' ? 'Game Account' : 'Treo Thuê'}
                </span>
                <span className="text-white font-medium ml-2">{item.name}</span>
              </div>
              
              {item.type === 'boosting' && item.userProvidedData && (
                <div className="mb-4 p-3 rounded-lg bg-dark-900 border border-orange-500/20">
                  <h4 className="text-xs font-bold text-orange-400 mb-2 uppercase">Thông tin khách hàng cung cấp</h4>
                  <div className="space-y-1 text-sm text-white/80">
                    <p><span className="text-white/50 w-20 inline-block">Tài khoản:</span> <span className="font-mono text-white">{item.userProvidedData.username || 'N/A'}</span></p>
                    <p><span className="text-white/50 w-20 inline-block">Mật khẩu:</span> <span className="font-mono text-white">{item.userProvidedData.password || 'N/A'}</span></p>
                    <p><span className="text-white/50 w-20 inline-block">Server:</span> <span className="text-white">{item.userProvidedData.server || 'N/A'}</span></p>
                    <p><span className="text-white/50 w-20 inline-block">Ghi chú:</span> <span className="text-white">{item.userProvidedData.note || 'Không có'}</span></p>
                  </div>
                </div>
              )}
              
              {item.type !== 'boosting' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.type === 'vps' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/50">IP / Hostname</label>
                      <input 
                        type="text" 
                        className="input-field text-sm py-2 px-3" 
                        value={item.credentials.ip} 
                        onChange={e => handleChange(index, 'ip', e.target.value)} 
                        placeholder="VD: 103.123.45.67"
                        required 
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Tài khoản (Username)</label>
                  <input 
                    type="text" 
                    className="input-field text-sm py-2 px-3" 
                    value={item.credentials.username} 
                    onChange={e => handleChange(index, 'username', e.target.value)} 
                    placeholder={item.type === 'vps' ? 'VD: root' : 'VD: admin123'}
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50">Mật khẩu</label>
                  <input 
                    type="text" 
                    className="input-field text-sm py-2 px-3" 
                    value={item.credentials.password} 
                    onChange={e => handleChange(index, 'password', e.target.value)} 
                    placeholder="Nhập mật khẩu"
                    required 
                  />
                </div>

                {item.type === 'game_account' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50">Server Game</label>
                    <input 
                      type="text" 
                      className="input-field text-sm py-2 px-3" 
                      value={item.credentials.server} 
                      onChange={e => handleChange(index, 'server', e.target.value)} 
                      placeholder="VD: Server 1 - Châu Á"
                    />
                  </div>
                )}

                {item.type === 'vps' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/50">Chu kỳ</label>
                      <select 
                        className="input-field text-sm py-2 px-3 appearance-none" 
                        value={item.credentials.cycle} 
                        onChange={e => handleChange(index, 'cycle', e.target.value)} 
                      >
                        <option value="1 Tuần">1 Tuần</option>
                        <option value="1 Tháng">1 Tháng</option>
                        <option value="3 Tháng">3 Tháng</option>
                        <option value="6 Tháng">6 Tháng</option>
                        <option value="1 Năm">1 Năm</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/50">Ngày hết hạn</label>
                      <input 
                        type="date" 
                        className="input-field text-sm py-2 px-3" 
                        value={item.credentials.expiresAt} 
                        onChange={e => handleChange(index, 'expiresAt', e.target.value)} 
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={sendEmail} 
                onChange={(e) => setSendEmail(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border border-white/20 bg-dark-900 peer-checked:bg-primary-500 peer-checked:border-primary-500 flex items-center justify-center transition-colors">
                <svg className={`w-3 h-3 text-white transition-transform ${sendEmail ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Gửi email thông báo cho khách</span>
          </label>
        </div>

        <div className="p-4 border-t border-white/10 bg-dark-900/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary py-2 px-5">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-primary py-2 px-5 bg-green-500 hover:bg-green-600 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            {isSubmitting ? 'Đang xử lý...' : 'Cấp phát & Hoàn thành đơn'}
          </button>
        </div>
      </div>
    </div>
  );
}
