// src/components/ProductCard.jsx - Card hiển thị sản phẩm
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiCheck, FiServer, FiCpu, FiHardDrive,
  FiStar, FiZap, FiUser,
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';
import { toast } from 'react-toastify';
import TiltCard from './TiltCard';

// Format giá tiền VN
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const ProductCard = ({ product }) => {
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const inCart = isInCart(product._id);
  const isGame = product.type === 'game_account';
  const gameImages = Array.isArray(product.accountInfo?.images) ? product.accountInfo.images : [];
  const primaryGameImage = isGame && gameImages.length > 0 ? gameImages[0] : '';

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warn('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      navigate('/login');
      return;
    }
    addToCart(product);
  };

  return (
    <Link to={`/products/${product._id}`} className="block group">
      <TiltCard className="glass-card-hover h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-1">
        {/* Header gradient banner */}
        <div className={`h-36 flex items-center justify-center relative overflow-hidden ${
          isGame
            ? 'bg-gradient-to-br from-red-500/20 via-orange-500/10 to-yellow-500/5'
            : 'bg-gradient-to-br from-primary-500/20 via-blue-500/10 to-accent-500/5'
        }`}>
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          {primaryGameImage ? (
            <img src={primaryGameImage} alt={product.name} className="w-full h-full object-cover" />
          ) : isGame ? (
            <FaGamepad className="text-6xl text-red-400/60 group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <FiServer className="text-6xl text-primary-400/60 group-hover:scale-110 transition-transform duration-300" />
          )}
          {/* Stock badge */}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="absolute top-3 right-3 badge bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Còn {product.stock}
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-3 right-3 badge bg-red-500/20 text-red-400 border border-red-500/30">
              Hết hàng
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          {/* Type badge */}
          <span className={`w-fit mb-2 ${isGame ? 'badge-game' : 'badge-vps'}`}>
            {isGame ? '🎮 Game Account' : '🖥️ VPS'}
          </span>

          {/* Name */}
          <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-white/40 text-xs leading-relaxed mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Specs */}
          {isGame && product.accountInfo ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.accountInfo.server && (
                <span className="flex items-center gap-1 text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">
                  <FiUser className="text-xs" /> {product.accountInfo.server}
                </span>
              )}
              {product.accountInfo.level > 0 && (
                <span className="flex items-center gap-1 text-xs text-yellow-400/70 bg-yellow-500/10 px-2 py-1 rounded-md">
                  <FiStar className="text-xs" /> Lv.{product.accountInfo.level}
                </span>
              )}
            </div>
          ) : product.vpsInfo ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.vpsInfo.ram && (
                <span className="flex items-center gap-1 text-xs text-primary-400/80 bg-primary-500/10 px-2 py-1 rounded-md">
                  <FiZap className="text-xs" /> {product.vpsInfo.ram}
                </span>
              )}
              {product.vpsInfo.cpu && (
                <span className="flex items-center gap-1 text-xs text-accent-500/80 bg-accent-500/10 px-2 py-1 rounded-md">
                  <FiCpu className="text-xs" /> {product.vpsInfo.cpu}
                </span>
              )}
              {product.vpsInfo.storage && (
                <span className="flex items-center gap-1 text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">
                  <FiHardDrive className="text-xs" /> {product.vpsInfo.storage}
                </span>
              )}
            </div>
          ) : null}

          {/* Price + Add to cart */}
          <div className="mt-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold gradient-text">{formatPrice(product.price)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                product.stock === 0
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : inCart
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                  : 'btn-primary py-2 px-3 text-xs'
              }`}
            >
              {product.stock === 0 ? (
                'Hết hàng'
              ) : inCart ? (
                <><FiCheck /> Đã thêm</>
              ) : (
                <><FiShoppingCart /> Thêm vào giỏ</>
              )}
            </button>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
};

export default ProductCard;
