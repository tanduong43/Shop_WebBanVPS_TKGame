// src/pages/admin/Products.jsx - Admin CRUD products
import { useCallback, useEffect, useMemo, useState } from 'react';
import { productAPI } from '../../services/api';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiRefreshCw, FiX,
} from 'react-icons/fi';

const emptyForm = {
  type: 'game_account',
  name: '',
  price: 0,
  stock: 1,
  description: '',
  tags: '',
  accountInfo: {
    server: '',
    level: 0,
    characters: '',
    items: '',
    loginMethod: '',
    extras: '',
  },
  vpsInfo: {
    ram: '',
    cpu: '',
    storage: '',
    bandwidth: '',
    os: '',
    location: '',
    uptime: '',
  },
};

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p || 0));

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAllAdmin({ page, limit: 10, search, type });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      type: p.type,
      name: p.name || '',
      price: p.price || 0,
      stock: p.stock ?? 0,
      description: p.description || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      accountInfo: { ...emptyForm.accountInfo, ...(p.accountInfo || {}) },
      vpsInfo: { ...emptyForm.vpsInfo, ...(p.vpsInfo || {}) },
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const payload = useMemo(() => {
    const base = {
      type: form.type,
      name: form.name.trim(),
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      description: form.description?.trim(),
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };
    if (form.type === 'game_account') {
      base.accountInfo = {
        server: form.accountInfo.server?.trim(),
        level: Number(form.accountInfo.level || 0),
        characters: form.accountInfo.characters?.trim(),
        items: form.accountInfo.items?.trim(),
        loginMethod: form.accountInfo.loginMethod?.trim(),
        extras: form.accountInfo.extras?.trim(),
      };
      base.vpsInfo = undefined;
    } else {
      base.vpsInfo = {
        ram: form.vpsInfo.ram?.trim(),
        cpu: form.vpsInfo.cpu?.trim(),
        storage: form.vpsInfo.storage?.trim(),
        bandwidth: form.vpsInfo.bandwidth?.trim(),
        os: form.vpsInfo.os?.trim(),
        location: form.vpsInfo.location?.trim(),
        uptime: form.vpsInfo.uptime?.trim(),
      };
      base.accountInfo = undefined;
    }
    return base;
  }, [form]);

  const validate = () => {
    if (!payload.name) return 'Tên sản phẩm là bắt buộc';
    if (payload.price < 0) return 'Giá không hợp lệ';
    if (payload.stock < 0) return 'Stock không hợp lệ';
    if (payload.type === 'vps') {
      if (!payload.vpsInfo?.ram || !payload.vpsInfo?.cpu) return 'VPS cần tối thiểu RAM và CPU';
    }
    if (payload.type === 'game_account') {
      if (!payload.accountInfo?.server) return 'Game account cần server';
    }
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) return toast.warn(err);
    setSaving(true);
    try {
      if (editing) {
        await productAPI.update(editing._id, payload);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await productAPI.create(payload);
        toast.success('Đã tạo sản phẩm');
      }
      closeModal();
      await fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!confirm(`Xóa (ẩn) sản phẩm "${p.name}"?`)) return;
    try {
      await productAPI.delete(p._id);
      toast.info('Đã xóa (soft delete)');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sản phẩm</h1>
          <p className="text-white/40 text-sm mt-1">CRUD game account & VPS</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-secondary py-2 px-4 text-sm inline-flex items-center gap-2">
            <FiRefreshCw /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2">
            <FiPlus /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-11"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên/mô tả..."
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <FiX />
            </button>
          )}
        </div>
        <select
          className="input-field lg:w-56 cursor-pointer"
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
        >
          <option value="" className="bg-dark-800">Tất cả loại</option>
          <option value="game_account" className="bg-dark-800">Game account</option>
          <option value="vps" className="bg-dark-800">VPS</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3">
              <tr className="text-left text-white/40">
                <th className="p-4">Tên</th>
                <th className="p-4">Loại</th>
                <th className="p-4 text-right">Giá</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Active</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={6}><div className="skeleton h-8 w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-6 text-white/40" colSpan={6}>Không có sản phẩm</td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p._id} className="text-white/70">
                    <td className="p-4">
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-white/40 text-xs line-clamp-1">{p.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={p.type === 'game_account' ? 'badge-game' : 'badge-vps'}>
                        {p.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold">{formatPrice(p.price)}</td>
                    <td className="p-4 text-center">{p.stock ?? 0}</td>
                    <td className="p-4 text-center">
                      <span className={`badge ${p.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                        {p.isActive ? 'yes' : 'no'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all inline-flex items-center gap-2"
                        >
                          <FiEdit2 /> Sửa
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all inline-flex items-center gap-2"
                        >
                          <FiTrash2 /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between gap-3">
            <p className="text-white/40 text-xs">
              Trang {pagination.page} / {pagination.totalPages} • {pagination.total} sản phẩm
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

      {/* Modal create/edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && closeModal()}
        title={editing ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Loại</label>
              <select
                className="input-field cursor-pointer"
                value={form.type}
                onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
              >
                <option value="game_account" className="bg-dark-800">Game account</option>
                <option value="vps" className="bg-dark-800">VPS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Stock</label>
              <input
                type="number"
                className="input-field"
                value={form.stock}
                onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tên</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Tên sản phẩm..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Giá</label>
              <input
                type="number"
                className="input-field"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                min={0}
              />
              <p className="text-white/40 text-xs mt-2">Preview: {formatPrice(form.price)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Tags (phân tách bằng dấu phẩy)</label>
              <input
                className="input-field"
                value={form.tags}
                onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                placeholder="lien quan, rank cao, ..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Mô tả</label>
            <textarea
              className="input-field min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="Mô tả ngắn..."
            />
          </div>

          {form.type === 'game_account' ? (
            <div className="glass-card p-4 space-y-4">
              <p className="text-white font-semibold">Account Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Server" value={form.accountInfo.server} onChange={(v) => setForm((s) => ({ ...s, accountInfo: { ...s.accountInfo, server: v } }))} />
                <Field label="Level" type="number" value={form.accountInfo.level} onChange={(v) => setForm((s) => ({ ...s, accountInfo: { ...s.accountInfo, level: v } }))} />
              </div>
              <Field label="Nhân vật" value={form.accountInfo.characters} onChange={(v) => setForm((s) => ({ ...s, accountInfo: { ...s.accountInfo, characters: v } }))} />
              <Field label="Vật phẩm" value={form.accountInfo.items} onChange={(v) => setForm((s) => ({ ...s, accountInfo: { ...s.accountInfo, items: v } }))} />
              <Field label="Login method" value={form.accountInfo.loginMethod} onChange={(v) => setForm((s) => ({ ...s, accountInfo: { ...s.accountInfo, loginMethod: v } }))} />
              <Field label="Extras" value={form.accountInfo.extras} onChange={(v) => setForm((s) => ({ ...s, accountInfo: { ...s.accountInfo, extras: v } }))} />
            </div>
          ) : (
            <div className="glass-card p-4 space-y-4">
              <p className="text-white font-semibold">VPS Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="RAM" value={form.vpsInfo.ram} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, ram: v } }))} />
                <Field label="CPU" value={form.vpsInfo.cpu} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, cpu: v } }))} />
                <Field label="Storage" value={form.vpsInfo.storage} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, storage: v } }))} />
                <Field label="Bandwidth" value={form.vpsInfo.bandwidth} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, bandwidth: v } }))} />
                <Field label="OS" value={form.vpsInfo.os} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, os: v } }))} />
                <Field label="Location" value={form.vpsInfo.location} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, location: v } }))} />
              </div>
              <Field label="Uptime" value={form.vpsInfo.uptime} onChange={(v) => setForm((s) => ({ ...s, vpsInfo: { ...s.vpsInfo, uptime: v } }))} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} disabled={saving} className="btn-secondary py-2.5 px-4 text-sm">Hủy</button>
            <button onClick={onSave} disabled={saving} className="btn-primary py-2.5 px-4 text-sm">
              {saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const Field = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-white/70 mb-2">{label}</label>
    <input
      type={type}
      className="input-field"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

