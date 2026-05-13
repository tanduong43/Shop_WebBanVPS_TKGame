// src/pages/Products.jsx - Trang danh sách sản phẩm
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { SkeletonList } from '../components/SkeletonCard';
import {
  FiSearch, FiFilter, FiX, FiSliders,
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';
import { FiServer } from 'react-icons/fi';

const PRICE_RANGES = [
  { label: 'Tất cả', min: '', max: '' },
  { label: 'Dưới 50K',   min: 0,      max: 50000 },
  { label: 'Dưới 100K',  min: 0,      max: 100000 },
  { label: 'Dưới 200K',  min: 0,      max: 200000 },
  { label: '200K - 500K',min: 200000,  max: 500000 },
  { label: '500K - 1M',  min: 500000,  max: 1000000 },
  { label: 'Trên 1M',    min: 1000000, max: '' },
];

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Mới nhất' },
  { value: 'price_asc',      label: 'Giá tăng dần' },
  { value: 'price_desc',     label: 'Giá giảm dần' },
  { value: 'name_asc',       label: 'Tên A → Z' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  // Lấy params từ URL
  const currentType    = searchParams.get('type') || '';
  const currentSearch  = searchParams.get('search') || '';
  const currentPage    = parseInt(searchParams.get('page') || '1');
  const currentSort    = searchParams.get('sort') || 'createdAt_desc';
  const currentMinPrice= searchParams.get('minPrice') || '';
  const currentMaxPrice= searchParams.get('maxPrice') || '';

  const updateParam = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    setSearchParams({ page: '1' });
  };

  const hasActiveFilters = currentType || currentSearch || currentMinPrice || currentMaxPrice;

  // Fetch sản phẩm
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortOrder] = currentSort.split('_');
      const res = await productAPI.getAll({
        page:     currentPage,
        limit:    12,
        type:     currentType,
        search:   currentSearch,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice,
        sortBy,
        sortOrder,
      });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentType, currentSearch, currentMinPrice, currentMaxPrice, currentSort]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  // Search với debounce
  const [searchInput, setSearchInput] = useState(currentSearch);
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, updateParam]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="section-container">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {currentType === 'game_account' ? '🎮 Tài Khoản Game'
             : currentType === 'vps'        ? '🖥️ VPS & Hosting'
             : '🛍️ Tất Cả Sản Phẩm'}
          </h1>
          <p className="text-white/50">
            {pagination.total > 0 ? `${pagination.total} sản phẩm` : 'Không tìm thấy sản phẩm'}
          </p>
        </div>

        {/* ── Type Tabs ────────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-6">
          {[
            { value: '',             label: 'Tất Cả',       icon: null },
            { value: 'game_account', label: 'Game Account', icon: FaGamepad },
            { value: 'vps',          label: 'VPS',          icon: FiServer },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateParam('type', value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentType === value
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-primary'
                  : 'glass-card text-white/60 hover:text-white hover:border-primary-500/30'
              }`}
            >
              {Icon && <Icon />} {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar Filter (desktop) ──────────────────────────────── */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
            <FilterPanel
              currentMinPrice={currentMinPrice} currentMaxPrice={currentMaxPrice}
              hasActiveFilters={hasActiveFilters}
              updateParam={updateParam} clearFilters={clearFilters}
            />
          </aside>

          {/* ── Main Content ─────────────────────────────────────────── */}
          <div className="flex-1">
            {/* Search + Filter bar */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-11"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    <FiX />
                  </button>
                )}
              </div>
              {/* Sort */}
              <select
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input-field w-48 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-dark-800">{o.label}</option>
                ))}
              </select>
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  hasActiveFilters
                    ? 'border-primary-500/50 bg-primary-500/10 text-primary-400'
                    : 'border-white/10 bg-white/5 text-white/60'
                }`}
              >
                <FiSliders /> Lọc
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-400" />}
              </button>
            </div>

            {/* Mobile filter panel */}
            {showFilter && (
              <div className="lg:hidden glass-card p-4 mb-6 animate-slide-up">
                <FilterPanel
                  currentMinPrice={currentMinPrice} currentMaxPrice={currentMaxPrice}
                  hasActiveFilters={hasActiveFilters}
                  updateParam={updateParam} clearFilters={clearFilters}
                />
              </div>
            )}

            {/* Active filters chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentSearch && (
                  <FilterChip label={`"${currentSearch}"`} onRemove={() => { setSearchInput(''); updateParam('search', ''); }} />
                )}
                {(currentMinPrice || currentMaxPrice) && (
                  <FilterChip
                    label={`${currentMinPrice ? (currentMinPrice/1000)+'K' : '0'} – ${currentMaxPrice ? (currentMaxPrice/1000)+'K' : '∞'}`}
                    onRemove={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); }}
                  />
                )}
                <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 transition-colors">
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <SkeletonList count={12} />
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-7xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-white/50 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button onClick={clearFilters} className="btn-secondary">Xóa bộ lọc</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => updateParam('page', page)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs">
    {label}
    <button onClick={onRemove} className="hover:text-white"><FiX className="text-xs" /></button>
  </span>
);

const FilterPanel = ({ currentMinPrice, currentMaxPrice, hasActiveFilters, updateParam, clearFilters }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-white font-semibold flex items-center gap-2"><FiFilter /> Bộ Lọc</h3>
      {hasActiveFilters && (
        <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 transition-colors">Xóa tất cả</button>
      )}
    </div>

    {/* Price Range */}
    <div>
      <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Khoảng Giá</p>
      <div className="space-y-2">
        {PRICE_RANGES.map((range) => {
          const active = currentMinPrice === String(range.min) && currentMaxPrice === String(range.max);
          return (
            <button
              key={range.label}
              onClick={() => { updateParam('minPrice', range.min); updateParam('maxPrice', range.max); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export default Products;
