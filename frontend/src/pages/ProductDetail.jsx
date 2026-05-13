// src/pages/ProductDetail.jsx - Trang chi tiết sản phẩm
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiShoppingCart, FiCheck, FiArrowLeft, FiServer, FiCpu,
  FiHardDrive, FiWifi, FiMonitor, FiStar, FiUser, FiInfo,
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const InfoRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-3 py-3 border-b border-white/5">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="text-white/50 text-sm" />
      </div>
      <div>
        <p className="text-white/40 text-xs mb-0.5">{label}</p>
        <p className="text-white text-sm">{value}</p>
      </div>
    </div>
  ) : null;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [id]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await productAPI.getById(id);
        setProduct(res.data.data);
      } catch {
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.warn('Vui lòng đăng nhập để mua hàng!');
      navigate('/login');
      return;
    }
    addToCart(product, quantity);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return null;

  const isGame = product.type === 'game_account';
  const inCart = isInCart(product._id);
  const gameImages = isGame && Array.isArray(product.accountInfo?.images) ? product.accountInfo.images : [];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="section-container max-w-5xl">
        {/* Back */}
        <Link to="/products" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors group">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Quay lại
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Banner */}
          <div>
            <div className={`rounded-2xl overflow-hidden h-64 lg:h-auto flex items-center justify-center relative ${
              isGame
                ? 'bg-gradient-to-br from-red-500/20 via-orange-500/10 to-yellow-500/5'
                : 'bg-gradient-to-br from-primary-500/20 via-blue-500/10 to-accent-500/5'
            }`}>
              {isGame && gameImages.length > 0 ? (
                <img
                  src={gameImages[activeImageIndex] || gameImages[0]}
                  alt={`${product.name} ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '25px 25px',
                    }}
                  />
                  {isGame
                    ? <FaGamepad className="text-[120px] text-red-400/50" />
                    : <FiServer className="text-[120px] text-primary-400/50" />
                  }
                </>
              )}
              {/* Type badge */}
              <div className="absolute top-4 left-4">
                <span className={isGame ? 'badge-game' : 'badge-vps'}>
                  {isGame ? '🎮 Game Account' : '🖥️ VPS'}
                </span>
              </div>
              {/* Stock badge */}
              <div className="absolute top-4 right-4">
                {product.stock === 0 ? (
                  <span className="badge bg-red-500/30 text-red-400 border border-red-500/30">Hết hàng</span>
                ) : product.stock <= 3 ? (
                  <span className="badge bg-orange-500/30 text-orange-400 border border-orange-500/30">Còn {product.stock}</span>
                ) : (
                  <span className="badge bg-green-500/30 text-green-400 border border-green-500/30">Còn hàng</span>
                )}
              </div>
            </div>
            {isGame && gameImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {gameImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`rounded-lg overflow-hidden border ${activeImageIndex === index ? 'border-primary-400' : 'border-white/10'}`}
                  >
                    <img src={img} alt={`${product.name} thumb ${index + 1}`} className="w-full h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">{product.name}</h1>
            <p className="text-white/50 text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Price */}
            <div className="glass-card p-4 mb-6">
              <p className="text-white/40 text-sm mb-1">Giá bán</p>
              <p className="text-3xl font-black gradient-text">{formatPrice(product.price)}</p>
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-white/60 text-sm">Số lượng:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                  >−</button>
                  <span className="w-10 text-center text-white font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                  >+</button>
                </div>
                <span className="text-white/30 text-xs">({product.stock} còn lại)</span>
              </div>
            )}

            {/* Add to cart btn */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
                product.stock === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : inCart ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                : 'btn-primary'
              }`}
            >
              {product.stock === 0 ? 'Hết hàng'
               : inCart ? <><FiCheck /> Đã thêm vào giỏ</>
               : <><FiShoppingCart /> Thêm vào giỏ hàng</>}
            </button>
            {inCart && (
              <Link to="/cart" className="block text-center mt-3 text-primary-400 hover:text-primary-300 text-sm transition-colors">
                Đến giỏ hàng →
              </Link>
            )}
          </div>
        </div>

        {/* Specs Section */}
        <div className="mt-10 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiInfo className="text-primary-400" /> Thông Tin Chi Tiết
          </h2>
          {isGame && product.accountInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow icon={FiMonitor} label="Server" value={product.accountInfo.server} />
              <InfoRow icon={FiStar}   label="Level" value={product.accountInfo.level ? `Level ${product.accountInfo.level}` : null} />
              <InfoRow icon={FiUser}   label="Nhân Vật" value={product.accountInfo.characters} />
              <InfoRow icon={FiStar}   label="Vật Phẩm Nổi Bật" value={product.accountInfo.items} />
              <InfoRow icon={FiInfo}   label="Phương Thức Đăng Nhập" value={product.accountInfo.loginMethod} />
              <InfoRow icon={FiInfo}   label="Thông Tin Thêm" value={product.accountInfo.extras} />
            </div>
          ) : product.vpsInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow icon={FiCpu}       label="CPU"       value={product.vpsInfo.cpu} />
              <InfoRow icon={FiInfo}      label="RAM"       value={product.vpsInfo.ram} />
              <InfoRow icon={FiHardDrive} label="Lưu Trữ"  value={product.vpsInfo.storage} />
              <InfoRow icon={FiWifi}      label="Băng Thông" value={product.vpsInfo.bandwidth} />
              <InfoRow icon={FiMonitor}   label="Hệ Điều Hành" value={product.vpsInfo.os} />
              <InfoRow icon={FiServer}    label="Vị Trí"   value={product.vpsInfo.location} />
              <InfoRow icon={FiInfo}      label="Uptime SLA" value={product.vpsInfo.uptime} />
            </div>
          ) : <p className="text-white/40 text-sm">Không có thông tin chi tiết</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
