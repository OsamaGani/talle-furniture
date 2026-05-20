import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

// Shipping: ₹200 flat below the free-shipping threshold; free above ₹2,999
// (chairs are bulky so the threshold is higher than typical D2C). GST: 18%
// — the standard rate for most furniture in India under HSN 9401 (seats).
// Some plastic chairs can be 12% but using the higher rate keeps you safe
// with tax filings; charge what's right for your product mix.
const SHIPPING_FEE = 200;
const FREE_SHIPPING_THRESHOLD = 2999;
const TAX_RATE = 0.18;

const computeUnitPrice = (product) => {
  return product.discount > 0
    ? +(product.price - (product.price * product.discount) / 100).toFixed(2)
    : product.price;
};

// Build a stable unique line identifier so the same product in two
// different colours stays as two cart lines. Colour is normalised to lower
// case so "Red" and "red" don't create duplicate lines from typos.
const lineIdFor = (productId, color) => {
  const c = (color || '').trim().toLowerCase();
  return c ? `${productId}__${c}` : String(productId);
};

export function CartProvider({ children }) {
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
      const price = computeUnitPrice(productForPricing);
      const basePrice = price;

      if (existing) {
        return prev.map((p) =>
          p.lineId === targetLineId ? { ...p, qty: newQty, price } : p
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
        return { ...it, qty };
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
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
