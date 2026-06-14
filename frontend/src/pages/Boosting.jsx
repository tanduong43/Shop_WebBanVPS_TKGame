import { useState, useEffect } from 'react';
import { productAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { FiCheck, FiInfo, FiShield, FiZap, FiServer } from 'react-icons/fi';
import TiltCard from '../components/TiltCard';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p || 0));

export default function Boosting() {
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isAuthenticated, user, updateBalance } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  if (settings.boosting_enabled === false) {
    return <Navigate to="/" replace />;
  }

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    server: '',
    note: '',
    months: 1 // Mặc định 1 tháng
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.getAll({ type: 'boosting', limit: 50 });
        setProducts(res.data.data);
      } catch (err) {
        toast.error('Không thể tải danh sách game treo thuê');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchMyOrders = async () => {
      if (!isAuthenticated) {
        setLoadingOrders(false);
        return;
      }
      try {
        const res = await orderAPI.getMyOrders({ type: 'boosting', limit: 50 });
        setMyOrders(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchProducts();
    fetchMyOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isAuthenticated]);

  // Lọc ra danh sách các item boosting thực sự từ order
  const myBoostingAccounts = myOrders.flatMap(order => 
    (order.items || [])
      .filter(item => item.type === 'boosting')
      .map(item => ({
        ...item,
        orderId: order._id,
        orderStatus: order.status,
        createdAt: order.createdAt
      }))
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warn('Vui lòng đăng nhập để sử dụng dịch vụ');
      navigate('/login');
      return;
    }
    if (!selectedProduct) {
      toast.warn('Vui lòng chọn gói treo thuê');
      return;
    }
    if (!formData.username || !formData.password || !formData.server) {
      toast.warn('Vui lòng nhập đầy đủ Tài khoản, Mật khẩu và Server');
      return;
    }

    const totalCost = selectedProduct.price * formData.months;

    if (user.balance < totalCost) {
      toast.error(`Số dư của bạn không đủ! Vui lòng nạp thêm ${formatPrice(totalCost - user.balance)}`);
      navigate('/deposit');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        items: [
          {
            productId: selectedProduct._id,
            quantity: Number(formData.months), // Số lượng tượng trưng cho số tháng
            userProvidedData: formData
          }
        ]
      };
      const res = await orderAPI.create(orderPayload);
      
      // Update balance in realtime
      if (res.data?.data?.newBalance !== undefined) {
        updateBalance(res.data.data.newBalance);
      }
      
      toast.success('Đăng ký treo thuê thành công! Đơn hàng đang được Admin xử lý.');
      
      // Refresh orders
      try {
        const resOrders = await orderAPI.getMyOrders({ type: 'boosting', limit: 50 });
        setMyOrders(resOrders.data.data);
      } catch(e) {}
      
      // Reset form
      setFormData({ username: '', password: '', server: '', note: '', months: 1 });
      setSelectedProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm font-bold mb-4 border border-orange-500/20">
            <FiZap /> Treo Thuê 24/7
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Dịch Vụ <span className="gradient-text">Cày Thuê</span> Siêu Tốc
          </h1>
          <p className="text-white/60 leading-relaxed">
            Hệ thống tự động farm cấp, farm đồ an toàn tuyệt đối. VPS riêng biệt không giật lag. Hỗ trợ 24/7 bảo mật tài khoản 100%.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột 1: Chọn Game */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm">1</span>
              Chọn Gói Game Cần Treo
            </h2>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl w-full" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/50">
                Chưa có gói treo thuê nào được mở bán. Vui lòng quay lại sau!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => {
                  const isSelected = selectedProduct?._id === p._id;
                  return (
                    <TiltCard key={p._id} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary-500 scale-[1.02]' : 'hover:border-white/20'}`}>
                      <div 
                        className={`glass-card p-5 h-full border ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5 bg-white/5'}`}
                        onClick={() => setSelectedProduct(p)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white text-lg leading-tight">{p.name}</h3>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-white/20'}`}>
                            {isSelected && <FiCheck className="text-white text-xs" />}
                          </div>
                        </div>
                        <p className="text-white/40 text-xs mb-4 line-clamp-2">{p.description}</p>
                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-primary-400 font-bold">{formatPrice(p.price)}</span>
                          <span className="text-xs text-white/40 bg-dark-800 px-2 py-1 rounded">/ gói</span>
                        </div>
                      </div>
                    </TiltCard>
                  );
                })}
              </div>
            )}
            
            <div className="glass-card p-5 mt-6 border border-white/5 bg-gradient-to-br from-dark-800 to-dark-900">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2"><FiShield className="text-green-400" /> Cam kết dịch vụ</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2"><FiCheck className="text-green-400 mt-0.5 shrink-0" /> Bảo mật thông tin tài khoản tuyệt đối.</li>
                <li className="flex items-start gap-2"><FiCheck className="text-green-400 mt-0.5 shrink-0" /> Không sử dụng phần mềm thứ 3 can thiệp game (No Hack/Cheat).</li>
                <li className="flex items-start gap-2"><FiCheck className="text-green-400 mt-0.5 shrink-0" /> Đền bù 100% nếu tài khoản bị khóa do lỗi của hệ thống.</li>
              </ul>
            </div>
          </div>

          {/* Cột 2: Form Nhập Liệu */}
          <div className="lg:col-span-5">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-sm">2</span>
              Thông Tin Tài Khoản
            </h2>

            <div className="glass-card p-6 border-accent-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 blur-3xl rounded-full" />
              
              {!selectedProduct ? (
                <div className="text-center py-12 text-white/40 flex flex-col items-center relative z-10">
                  <FiInfo className="text-4xl mb-3 opacity-50" />
                  <p>Vui lòng chọn một gói game bên trái<br/>để tiếp tục đăng ký</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10 animate-fade-in">
                  <div className="p-3 rounded-lg bg-dark-900 border border-white/5 mb-6 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-white/50 mb-0.5">Đang chọn gói:</p>
                      <p className="text-sm font-semibold text-white">{selectedProduct.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50 mb-0.5">{formatPrice(selectedProduct.price)} / tháng</p>
                      <p className="text-lg font-bold text-primary-400">{formatPrice(selectedProduct.price * formData.months)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Tài khoản Game <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="input-field py-2.5" 
                        placeholder="Nhập tên đăng nhập/email..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Mật khẩu Game <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field py-2.5 font-mono" 
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Server / Máy chủ <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        name="server"
                        value={formData.server}
                        onChange={handleChange}
                        className="input-field py-2.5" 
                        placeholder="VD: S1 HT9 - HT Blue..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1.5">Thời gian thuê (Tháng)</label>
                      <select 
                        name="months" 
                        value={formData.months} 
                        onChange={handleChange} 
                        className="input-field py-2.5"
                      >
                        {[1, 2, 3, 4, 5, 6, 12].map(m => (
                          <option key={m} value={m}>{m} Tháng</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Ghi chú thêm (Tùy chọn)</label>
                    <textarea 
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      className="input-field py-2.5 min-h-[80px]" 
                      placeholder="VD: Treo bãi quái 90, không nhặt rác..."
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-6">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full btn-primary py-3.5 text-base shadow-glow-primary flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Đang xử lý...' : (
                        <>
                          <FiServer /> Gửi thông tin
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-white/40 mt-3">
                      Hệ thống sẽ tự động trừ tiền trong ví nếu số dư đủ.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Cột Bảng Thống Kê Nick Của Tôi */}
        {isAuthenticated && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
                <FiServer />
              </span>
              Bảng Thông Tin Nick Đang Cày
            </h2>
            
            <div className="glass-card overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/50 border-b border-white/5">
                    <tr>
                      <th className="p-4 font-semibold">Gói (Game)</th>
                      <th className="p-4 font-semibold">Tài Khoản</th>
                      <th className="p-4 font-semibold">Server</th>
                      <th className="p-4 font-semibold">Ngày Bắt Đầu</th>
                      <th className="p-4 font-semibold">Ngày Hết Hạn</th>
                      <th className="p-4 font-semibold text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loadingOrders ? (
                      <tr><td colSpan={6} className="p-8 text-center text-white/40">Đang tải dữ liệu...</td></tr>
                    ) : myBoostingAccounts.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-white/40 bg-dark-900/50">Bạn chưa có tài khoản nào đang thuê cày.</td></tr>
                    ) : (
                      myBoostingAccounts.map((acc, index) => {
                        const statusColor = 
                          acc.orderStatus === 'completed' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                          acc.orderStatus === 'processing' ? 'text-primary-400 bg-primary-500/10 border-primary-500/20' :
                          acc.orderStatus === 'cancelled' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          'text-amber-400 bg-amber-500/10 border-amber-500/20'; // pending_contact
                          
                        const statusText = 
                          acc.orderStatus === 'completed' ? 'Hoàn Thành' :
                          acc.orderStatus === 'processing' ? 'Đang Cày' :
                          acc.orderStatus === 'cancelled' ? 'Đã Hủy' : 'Chờ Xử Lý';

                        // Hiển thị một phần username
                        const hiddenUser = acc.userProvidedData?.username ? 
                          acc.userProvidedData.username.slice(0, 3) + '***' : 'N/A';

                        return (
                          <tr key={`${acc.orderId}-${index}`} className="text-white/80 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-white">{acc.name}</td>
                            <td className="p-4 font-mono">{hiddenUser}</td>
                            <td className="p-4">{acc.userProvidedData?.server || 'N/A'}</td>
                            <td className="p-4">{new Date(acc.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="p-4">
                              {acc.credentials?.expiresAt ? (
                                <span className="text-orange-400 font-medium">
                                  {new Date(acc.credentials.expiresAt).toLocaleDateString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-white/30 italic">Chưa cập nhật</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
