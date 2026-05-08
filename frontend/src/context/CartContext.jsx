// src/context/CartContext.jsx - Quản lý giỏ hàng
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext'; // 👈 thêm

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // 👈 thêm
  const [cart, setCart] = useState([]);

  // Key riêng theo từng user, guest không có key
  const cartKey = user?._id ? `webshopac_cart_${user._id}` : null; // 👈 thêm

  // Load cart từ localStorage khi user thay đổi (login/logout)
  useEffect(() => {
    if (!cartKey) {
      setCart([]); // đăng xuất → reset giỏ hàng
      return;
    }
    try {
      const saved = localStorage.getItem(cartKey);
      setCart(saved ? JSON.parse(saved) : []);
    } catch {
      setCart([]);
    }
  }, [cartKey]); // 👈 chạy lại mỗi khi user thay đổi

  // Sync cart → localStorage (chỉ khi đã đăng nhập)
  useEffect(() => {
    if (!cartKey) return; // guest → không lưu
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  // Thêm sản phẩm vào giỏ
  const addToCart = useCallback((product, quantity = 1) => {
    if (!user) { // 👈 chặn guest
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        toast.success(`Đã thêm thêm ${product.name} vào giỏ hàng`);
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`✅ ${product.name} đã được thêm vào giỏ hàng!`);
      return [...prev, { ...product, quantity }];
    });
  }, [user]); // 👈 thêm user vào deps

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
    toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
  }, []);

  // Cập nhật số lượng
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(() => {
    setCart([]);
    if (cartKey) localStorage.removeItem(cartKey); // 👈 xóa đúng key
  }, [cartKey]);

  // Tính tổng tiền
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tổng số lượng items
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Kiểm tra sản phẩm có trong giỏ không
  const isInCart = useCallback((productId) => cart.some((item) => item._id === productId), [cart]);

  return (
    <CartContext.Provider value={{
      cart, totalPrice, totalItems,
      addToCart, removeFromCart, updateQuantity, clearCart, isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng trong CartProvider');
  return context;
};

export default CartContext;