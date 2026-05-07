// src/pages/Cart.jsx - Trang giỏ hàng
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowRight,
  FiMessageCircle, FiAlertCircle,
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa';
import { FiServer } from 'react-icons/fi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const Cart = () => {
  const { cart, totalPrice, totalItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      toast.warn('Vui lòng đăng nhập để đặt hàng!');
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      toast.warn('Giỏ hàng trống!');
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item._id,
        quantity:  item.quantity,
      }));

      const res = await orderAPI.create({ items });
      const { zaloUrl } = res.data.data;

      toast.success('Đặt hàng thành công! Đang chuyển sang Zalo...', { autoClose: 2000 });
      clearCart();

      // Redirect sang Zalo sau 1.5 giây
      setTimeout(() => {
        window.open(zaloUrl, '_blank');
        navigate('/orders');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <FiShoppingCart className="text-5xl text-white/20" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Giỏ hàng trống</h2>
          <p className="text-white/50 mb-8">Thêm sản phẩm vào giỏ để bắt đầu mua sắm!</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <FiShoppingCart /> Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="section-container max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Giỏ Hàng</h1>
            <p className="text-white/50 mt-1">{totalItems} sản phẩm</p>
          </div>
          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors">
            <FiTrash2 /> Xóa tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <CartItemRow key={item._id} item={item} onRemove={removeFromCart} onUpdate={updateQuantity} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-5">Tóm Tắt Đơn Hàng</h3>

              {/* Items breakdown */}
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-white/50 truncate max-w-[60%]">{item.name} ×{item.quantity}</span>
                    <span className="text-white/70">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Tổng cộng</span>
                  <span className="text-2xl font-bold gradient-text">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Zalo notice */}
              <div className="flex gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-5">
                <FiAlertCircle className="text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-400/80 text-xs leading-relaxed">
                  Sau khi đặt hàng, bạn sẽ được chuyển sang <strong>Zalo</strong> để liên hệ admin xác nhận đơn hàng.
                </p>
              </div>

              <button
                onClick={handleOrder}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><FiMessageCircle className="text-lg" /> Đặt hàng & Liên hệ Zalo <FiArrowRight /></>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-white/40 text-xs mt-3">
                  <Link to="/login" className="text-primary-400 hover:underline">Đăng nhập</Link> để đặt hàng
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItemRow = ({ item, onRemove, onUpdate }) => {
  const isGame = item.type === 'game_account';
  return (
    <div className="glass-card p-4 flex gap-4 items-center animate-fade-in">
      {/* Icon */}
      <div className={`w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center ${
        isGame ? 'bg-red-500/10' : 'bg-primary-500/10'
      }`}>
        {isGame
          ? <FaGamepad className="text-3xl text-red-400/70" />
          : <FiServer  className="text-3xl text-primary-400/70" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-semibold ${isGame ? 'text-red-400' : 'text-primary-400'}`}>
          {isGame ? '🎮 Game' : '🖥️ VPS'}
        </span>
        <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
        <p className="text-primary-400 font-semibold mt-0.5">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => onUpdate(item._id, item.quantity - 1)} disabled={item.quantity <= 1}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition-all">
          <FiMinus className="text-xs" />
        </button>
        <span className="w-8 text-center text-white text-sm font-semibold">{item.quantity}</span>
        <button onClick={() => onUpdate(item._id, item.quantity + 1)}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
          <FiPlus className="text-xs" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right hidden sm:block min-w-[90px]">
        <p className="text-white/40 text-xs">Tổng</p>
        <p className="text-white font-semibold text-sm">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
        </p>
      </div>

      {/* Remove */}
      <button onClick={() => onRemove(item._id)}
        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
        <FiTrash2 />
      </button>
    </div>
  );
};

export default Cart;
