import { useState, useEffect, useCallback } from 'react';
import { productAPI, orderAPI } from '../../services/api';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiServer, FiSettings, FiCheck } from 'react-icons/fi';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p || 0));

export default function AdminBoosting() {
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'accounts'
  
  // States for packages
  const [packages, setPackages] = useState([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formPkg, setFormPkg] = useState({ name: '', gameName: '', price: 0, stock: 1, description: '' });
  const [saving, setSaving] = useState(false);

  // States for accounts (orders)
  const [accounts, setAccounts] = useState([]);
  const [loadingAccs, setLoadingAccs] = useState(true);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formAcc, setFormAcc] = useState({ status: '', expiresAt: '' });
  
  // Filter for accounts
  const [selectedGameFilter, setSelectedGameFilter] = useState('');

  const fetchPackages = useCallback(async () => {
    setLoadingPkgs(true);
    try {
      const res = await productAPI.getAllAdmin({ limit: 100, type: 'boosting' });
      setPackages(res.data.data);
    } catch (e) {
      toast.error('Lỗi tải gói cày thuê');
    } finally {
      setLoadingPkgs(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setLoadingAccs(true);
    try {
      const res = await orderAPI.getAllOrders({ limit: 500, type: 'boosting' });
      const orders = res.data.data;
      
      const flatAccounts = orders.flatMap(order => 
        (order.items || [])
          .filter(item => item.type === 'boosting')
          .map(item => ({
            ...item,
            orderId: order._id,
            orderStatus: order.status,
            createdAt: order.createdAt,
            userEmail: order.userId?.email,
            username: order.userId?.username
          }))
      );
      
      setAccounts(flatAccounts);
    } catch (e) {
      toast.error('Lỗi tải danh sách nick cày thuê');
    } finally {
      setLoadingAccs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'packages') fetchPackages();
    else fetchAccounts();
  }, [activeTab, fetchPackages, fetchAccounts]);

  // --- Package Management ---
  const openCreatePkg = () => {
    setEditingPkg(null);
    setFormPkg({ name: '', gameName: '', price: 0, stock: 1, description: '' });
    setModalOpen(true);
  };

  const openEditPkg = (p) => {
    setEditingPkg(p);
    setFormPkg({
      name: p.name || '',
      gameName: p.boostingInfo?.gameName || '',
      price: p.price || 0,
      stock: p.stock ?? 1,
      description: p.description || '',
    });
    setModalOpen(true);
  };

  const savePackage = async () => {
    if (!formPkg.name || !formPkg.gameName) return toast.warn('Tên gói và Tên Game không được để trống');
    setSaving(true);
    const payload = {
      type: 'boosting',
      name: formPkg.name.trim(),
      price: Number(formPkg.price),
      stock: Number(formPkg.stock),
      description: formPkg.description.trim(),
      boostingInfo: { gameName: formPkg.gameName.trim() }
    };

    try {
      if (editingPkg) {
        await productAPI.update(editingPkg._id, payload);
        toast.success('Đã cập nhật gói');
      } else {
        await productAPI.create(payload);
        toast.success('Đã tạo gói mới');
      }
      setModalOpen(false);
      fetchPackages();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async (p) => {
    if (!confirm(`Xóa gói "${p.name}"?`)) return;
    try {
      await productAPI.delete(p._id);
      toast.info('Đã xóa gói');
      fetchPackages();
    } catch (e) {
      toast.error('Xóa thất bại');
    }
  };

  // --- Account Management ---
  const uniqueGames = [...new Set(accounts.map(acc => packages.find(p => p._id === acc.productId)?.boostingInfo?.gameName || 'Không rõ'))];
  
  const filteredAccounts = selectedGameFilter 
    ? accounts.filter(acc => (packages.find(p => p._id === acc.productId)?.boostingInfo?.gameName || 'Không rõ') === selectedGameFilter)
    : accounts;

  const openProcessAcc = (acc) => {
    setSelectedAccount(acc);
    setFormAcc({
      status: acc.orderStatus,
      expiresAt: acc.credentials?.expiresAt ? new Date(acc.credentials.expiresAt).toISOString().split('T')[0] : ''
    });
    setProcessModalOpen(true);
  };

  const saveAccountProcess = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      // 1. Update order status if changed
      if (formAcc.status !== selectedAccount.orderStatus) {
        await orderAPI.updateStatus(selectedAccount.orderId, { status: formAcc.status });
      }
      
      toast.success('Cập nhật tiến độ nick thành công');
      setProcessModalOpen(false);
      fetchAccounts();
    } catch (e) {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiServer className="text-primary-400" /> Quản Lý Cày Thuê
          </h1>
          <p className="text-white/40 text-sm mt-1">Tạo nhóm game và theo dõi tiến độ cày nick</p>
        </div>
        
        <div className="flex gap-2 bg-dark-800 p-1 rounded-xl border border-white/5">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'packages' ? 'bg-primary-500/20 text-primary-400' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('packages')}
          >
            1. Các Khóa Cày
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'accounts' ? 'bg-primary-500/20 text-primary-400' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('accounts')}
          >
            2. Thống Kê Nick
          </button>
        </div>
      </div>

      {/* --- TAB PACKAGES --- */}
      {activeTab === 'packages' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end gap-2">
            <button onClick={fetchPackages} className="btn-secondary py-2 px-3 text-sm"><FiRefreshCw /> Tải lại</button>
            <button onClick={openCreatePkg} className="btn-primary py-2 px-3 text-sm flex items-center gap-2"><FiPlus /> Thêm Khóa Mới</button>
          </div>
          
          <div className="glass-card overflow-hidden border border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="p-4 font-semibold">Tên Game</th>
                  <th className="p-4 font-semibold">Khóa Cày (Gói)</th>
                  <th className="p-4 font-semibold text-right">Giá</th>
                  <th className="p-4 font-semibold text-center">Active</th>
                  <th className="p-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingPkgs ? (
                  <tr><td colSpan={5} className="p-6 text-center text-white/40">Đang tải...</td></tr>
                ) : packages.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-white/40">Chưa có khóa cày nào</td></tr>
                ) : (
                  packages.map(p => (
                    <tr key={p._id} className="text-white/80 hover:bg-white/5">
                      <td className="p-4">
                        <span className="px-2 py-1 bg-accent-500/20 text-accent-400 rounded text-xs font-bold border border-accent-500/30">
                          {p.boostingInfo?.gameName || 'Chưa phân nhóm'}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-white">{p.name}</td>
                      <td className="p-4 text-right font-semibold text-primary-400">{formatPrice(p.price)}</td>
                      <td className="p-4 text-center">
                        <span className={`badge ${p.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                          {p.isActive ? 'yes' : 'no'}
                        </span>
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => openEditPkg(p)} className="p-2 bg-white/5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"><FiEdit2 /></button>
                        <button onClick={() => deletePackage(p)} className="p-2 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB ACCOUNTS --- */}
      {activeTab === 'accounts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-dark-800 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm pl-2">Lọc theo Game:</span>
              <select 
                className="input-field py-1.5 px-3 text-sm w-48"
                value={selectedGameFilter}
                onChange={e => setSelectedGameFilter(e.target.value)}
              >
                <option value="">Tất cả các Game</option>
                {uniqueGames.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchAccounts} className="btn-secondary py-1.5 px-3 text-sm"><FiRefreshCw /> Tải lại</button>
          </div>

          <div className="glass-card overflow-hidden border border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="p-4 font-semibold">Khách Hàng</th>
                  <th className="p-4 font-semibold">Nhóm Game</th>
                  <th className="p-4 font-semibold">Tài Khoản Gửi</th>
                  <th className="p-4 font-semibold">Ngày Hết Hạn</th>
                  <th className="p-4 font-semibold text-center">Trạng Thái</th>
                  <th className="p-4 font-semibold text-right">Xử Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingAccs ? (
                  <tr><td colSpan={6} className="p-6 text-center text-white/40">Đang tải danh sách nick...</td></tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-white/40">Không có nick nào đang thuê cày</td></tr>
                ) : (
                  filteredAccounts.map((acc, index) => {
                    const gameName = packages.find(p => p._id === acc.productId)?.boostingInfo?.gameName || 'Không rõ';
                    const statusColor = 
                      acc.orderStatus === 'completed' ? 'text-green-400 bg-green-500/10' :
                      acc.orderStatus === 'processing' ? 'text-primary-400 bg-primary-500/10' :
                      acc.orderStatus === 'cancelled' ? 'text-red-400 bg-red-500/10' :
                      'text-amber-400 bg-amber-500/10';
                      
                    const statusText = 
                      acc.orderStatus === 'completed' ? 'Xong' :
                      acc.orderStatus === 'processing' ? 'Đang cày' :
                      acc.orderStatus === 'cancelled' ? 'Hủy' : 'Chờ';

                    return (
                      <tr key={`${acc.orderId}-${index}`} className="text-white/80 hover:bg-white/5">
                        <td className="p-4">
                          <p className="text-white font-medium">{acc.username}</p>
                          <p className="text-[10px] text-white/40 font-mono">#{acc.orderId.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-accent-400 uppercase">{gameName}</span>
                          <p className="text-xs text-white/50 mt-0.5">{acc.name}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-white font-mono">{acc.userProvidedData?.username}</p>
                          <p className="text-[10px] text-white/40">Pass: {acc.userProvidedData?.password} | {acc.userProvidedData?.server}</p>
                        </td>
                        <td className="p-4 text-orange-400">
                          {acc.credentials?.expiresAt ? new Date(acc.credentials.expiresAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>{statusText}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => openProcessAcc(acc)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 ml-auto">
                            <FiSettings /> Cập nhật
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editingPkg ? 'Sửa Khóa Cày' : 'Thêm Khóa Cày Mới'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Nhóm Game (VD: Ngọc Rồng, Liên Quân)</label>
            <input className="input-field" value={formPkg.gameName} onChange={e => setFormPkg({...formPkg, gameName: e.target.value})} placeholder="Nhập tên game..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Tên Gói / Khóa</label>
            <input className="input-field" value={formPkg.name} onChange={e => setFormPkg({...formPkg, name: e.target.value})} placeholder="VD: Gói cày cấp 1-50..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Giá Tiền</label>
              <input type="number" className="input-field" value={formPkg.price} onChange={e => setFormPkg({...formPkg, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Số Lượng Có Sẵn</label>
              <input type="number" className="input-field" value={formPkg.stock} onChange={e => setFormPkg({...formPkg, stock: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Mô tả chi tiết</label>
            <textarea className="input-field min-h-[80px]" value={formPkg.description} onChange={e => setFormPkg({...formPkg, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2 text-sm">Hủy</button>
            <button onClick={savePackage} disabled={saving} className="btn-primary px-4 py-2 text-sm">
              {saving ? 'Đang lưu...' : (editingPkg ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={processModalOpen} onClose={() => !saving && setProcessModalOpen(false)} title="Cập Nhật Tiến Độ Cày Thuê">
        {selectedAccount && (
          <div className="space-y-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-sm text-white/70">
              <p><span className="text-white/40 w-24 inline-block">Khách hàng:</span> <span className="text-white">{selectedAccount.username}</span></p>
              <p><span className="text-white/40 w-24 inline-block">Gói cày:</span> <span className="text-white">{selectedAccount.name}</span></p>
              <div className="pt-2 mt-2 border-t border-white/5">
                <p><span className="text-white/40 w-24 inline-block">Tài khoản:</span> <span className="text-white font-mono">{selectedAccount.userProvidedData?.username}</span></p>
                <p><span className="text-white/40 w-24 inline-block">Mật khẩu:</span> <span className="text-white font-mono">{selectedAccount.userProvidedData?.password}</span></p>
                <p><span className="text-white/40 w-24 inline-block">Ghi chú:</span> <span className="text-white">{selectedAccount.userProvidedData?.note || 'Không có'}</span></p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Trạng thái đơn cày</label>
              <select className="input-field" value={formAcc.status} onChange={e => setFormAcc({...formAcc, status: e.target.value})}>
                <option value="pending_contact" className="bg-dark-800">Chờ xử lý (Chưa cày)</option>
                <option value="processing" className="bg-dark-800">Đang cày (Hệ thống tự tính hạn)</option>
                <option value="completed" className="bg-dark-800">Hoàn thành (Đã xong)</option>
                <option value="cancelled" className="bg-dark-800">Hủy bỏ</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setProcessModalOpen(false)} className="btn-secondary px-4 py-2 text-sm">Đóng</button>
              <button onClick={saveAccountProcess} disabled={saving} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                <FiCheck /> {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
