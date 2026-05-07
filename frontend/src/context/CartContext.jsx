// src/context/CartContext.jsx - Quản lý giỏ hàng
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

const CART_KEY = 'webshopac_cart';

export const CartProvider = ({ children }) => {
  // Khởi tạo cart từ localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart → localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Thêm sản phẩm vào giỏ
  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        // Đã có → tăng số lượng
        toast.success(`Đã thêm thêm ${product.name} vào giỏ hàng`);
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Chưa có → thêm mới
      toast.success(`✅ ${product.name} đã được thêm vào giỏ hàng!`);
      return [...prev, { ...product, quantity }];
    });
  }, []);

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
    localStorage.removeItem(CART_KEY);
  }, []);

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
