import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Shipping: ₹50 flat below the free-shipping threshold; free above ₹999
// (a common Indian D2C bar). GST: 18% — the standard rate for most toys
// in India under HSN 9503. Educational/wooden toys can be 12% but using
// the higher rate keeps you safe with tax filings; charge what's right
// for your product mix.
const SHIPPING_FEE = 50;
const FREE_SHIPPING_THRESHOLD = 999;
const TAX_RATE = 0.18;

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

// Build a stable unique line identifier so the same product in two
// different colours stays as two cart lines. Colour is normalised to lower
// case so "Red" and "red" don't create duplicate lines from typos.
const lineIdFor = (productId, color) => {
  const c = (color || '').trim().toLowerCase();
  return c ? `${productId}__${c}` : String(productId);
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const isWholesale = user?.accountType === 'wholesale';

  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart');
      const parsed = stored ? JSON.parse(stored) : [];
      // Backfill lineId on items saved before the colour feature shipped.
      return Array.isArray(parsed) ? parsed.map((it) => ({
        ...it,
        lineId: it.lineId || lineIdFor(it.product, it.color),
        color: it.color || '',
      })) : [];
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

  const addToCart = (product, qty = 1, color = '') => {
    const targetLineId = lineIdFor(product._id, color);
    // Resolve variant-level price/discount overrides if the customer picked
    // a coloured variant. Falls back to the product's main price + discount.
    // Mirrors the server-side unitPriceFor() so cart preview == final charge.
    const variant = color
      ? (product.colorVariants || []).find((v) => v.color.toLowerCase() === color.toLowerCase())
      : null;
    const effPrice = (variant && variant.price > 0) ? variant.price : product.price;
    const effDiscount = (variant && variant.discount > 0) ? variant.discount : product.discount;
    const productForPricing = {
      ...product,
      price: effPrice,
      discount: effDiscount,
    };

    setItems((prev) => {
      const existing = prev.find((p) => p.lineId === targetLineId);
      const newQty = (existing?.qty || 0) + qty;
      const { price, isWholesalePrice } = computeUnitPrice(productForPricing, newQty, isWholesale);
      const basePrice = effDiscount > 0
        ? +(effPrice - (effPrice * effDiscount) / 100).toFixed(2)
        : effPrice;

      if (existing) {
        return prev.map((p) =>
          p.lineId === targetLineId ? { ...p, qty: newQty, price, isWholesalePrice } : p
        );
      }
      return [
        ...prev,
        {
          lineId: targetLineId,
          product: product._id,
          name: product.name,
          image: product.image || product.images?.[0] || '',
          color: color || '',
          basePrice,
          price,
          qty: newQty,
          wholesalePrice: product.wholesalePrice || 0,
          wholesaleMinQty: product.wholesaleMinQty || 0,
          isWholesalePrice,
        },
      ];
    });
    toast.success(color ? `Added (${color}) to cart` : 'Added to cart');
  };

  // Both updateQty and removeFromCart accept either a lineId or, for
  // backward compatibility, a raw productId (which only matches the
  // colour-less line for that product).
  const updateQty = (lineId, qty) => {
    if (qty < 1) return removeFromCart(lineId);
    setItems((prev) =>
      prev.map((it) => {
        if (it.lineId !== lineId && it.product !== lineId) return it;
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

  const removeFromCart = (lineId) => {
    setItems((prev) => prev.filter((it) => it.lineId !== lineId && it.product !== lineId));
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
