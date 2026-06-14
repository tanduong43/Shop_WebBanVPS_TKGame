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
  const { isAuthenticated, updateBalance } = useAuth();
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

      if (res.data?.data?.newBalance !== undefined) {
        updateBalance(res.data.data.newBalance);
      }

      toast.success(res.data?.message || 'Thanh toán thành công! Đơn hàng của bạn đang được xử lý.', { autoClose: 2000 });
      clearCart();

      setTimeout(() => {
        navigate('/orders');
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại, vui lòng thử lại');
      if (err.response?.data?.message?.includes('Số dư không đủ')) {
        navigate('/deposit');
      }
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
      <div className="section-container max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FiShoppingCart className="text-primary-400" /> Thanh toán
            </h1>
            <p className="text-white/50 mt-1">{totalItems} sản phẩm trong đơn hàng</p>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-white/40 hover:text-red-400 flex items-center gap-2 text-sm transition-colors">
              <FiTrash2 /> Xóa tất cả
            </button>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <CartItemRow key={item._id} item={item} onRemove={removeFromCart} onUpdate={updateQuantity} />
          ))}
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-white/70 block mb-1">Tổng cộng cần thanh toán:</span>
              <span className="text-3xl font-bold text-white">{formatPrice(totalPrice)}</span>
            </div>

            <div className="w-full sm:w-auto flex flex-col gap-3">
              <button
                onClick={handleOrder}
                disabled={loading}
                className="btn-primary w-full sm:w-auto px-10 py-3.5 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><FiMessageCircle /> Đặt hàng ngay <FiArrowRight /></>
                )}
              </button>
              
              {!isAuthenticated && (
                <p className="text-center text-white/40 text-xs mt-1">
                  <Link to="/login" className="text-primary-400 hover:underline">Đăng nhập</Link> để đặt hàng
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 p-3 mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <FiAlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-xs leading-relaxed">
              Sau khi đặt hàng, hệ thống sẽ trừ trực tiếp <strong>{formatPrice(totalPrice)}</strong> vào số dư của bạn và đơn hàng sẽ được chuyển sang trạng thái <strong>Chờ xử lý</strong>.
            </p>
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
