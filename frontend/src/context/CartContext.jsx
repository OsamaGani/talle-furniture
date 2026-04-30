import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// TEMP — shipping + tax disabled while testing Razorpay live payments.
// Restore SHIPPING_FEE = 50 and TAX_RATE = 0.05 once testing is done.
const SHIPPING_FEE = 0;
const FREE_SHIPPING_THRESHOLD = 0;
const TAX_RATE = 0;

const computeUnitPrice = (product, qty, isWholesaleAccount) => {
  const base = product.discount > 0
    ? +(product.price - (product.price * product.discount) / 100).toFixed(2)
    : product.price;
  const eligible = isWholesaleAccount && product.wholesalePrice > 0 && product.wholesaleMinQty > 0 && qty >= product.wholesaleMinQty;
  return {
    price: eligible ? product.wholesalePrice : base,
    isWholesalePrice: eligible,
  };
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const isWholesale = user?.accountType === 'wholesale';

  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Recalculate prices whenever the wholesale flag changes
  useEffect(() => {
    setItems((prev) =>
      prev.map((it) => {
        const { price, isWholesalePrice } = computeUnitPrice(
          {
            price: it.basePrice ?? it.price,
            discount: 0,
            wholesalePrice: it.wholesalePrice,
            wholesaleMinQty: it.wholesaleMinQty,
          },
          it.qty,
          isWholesale
        );
        return { ...it, price, isWholesalePrice };
      })
    );
  }, [isWholesale]);

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product === product._id);
      const newQty = (existing?.qty || 0) + qty;
      const { price, isWholesalePrice } = computeUnitPrice(product, newQty, isWholesale);
      const basePrice = product.discount > 0
        ? +(product.price - (product.price * product.discount) / 100).toFixed(2)
        : product.price;

      if (existing) {
        return prev.map((p) =>
          p.product === product._id ? { ...p, qty: newQty, price, isWholesalePrice } : p
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          image: product.image || product.images?.[0] || '',
          basePrice,
          price,
          qty: newQty,
          wholesalePrice: product.wholesalePrice || 0,
          wholesaleMinQty: product.wholesaleMinQty || 0,
          isWholesalePrice,
        },
      ];
    });
    toast.success('Added to cart');
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((it) => {
        if (it.product !== productId) return it;
        const { price, isWholesalePrice } = computeUnitPrice(
          {
            price: it.basePrice ?? it.price,
            discount: 0,
            wholesalePrice: it.wholesalePrice,
            wholesaleMinQty: it.wholesaleMinQty,
          },
          qty,
          isWholesale
        );
        return { ...it, qty, price, isWholesalePrice };
      })
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((it) => it.product !== productId));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  }, [items.length, subtotal]);

  const tax = useMemo(() => +(subtotal * TAX_RATE).toFixed(2), [subtotal]);
  const total = useMemo(() => +(subtotal + shipping + tax).toFixed(2), [subtotal, shipping, tax]);
  const amountToFreeShipping = useMemo(
    () => Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    [subtotal]
  );
  const itemCount = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        subtotal,
        shipping,
        tax,
        total,
        amountToFreeShipping,
        FREE_SHIPPING_THRESHOLD,
        SHIPPING_FEE,
        isWholesale,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
