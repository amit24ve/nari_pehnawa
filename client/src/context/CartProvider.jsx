import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { trackCustomEvent } from '../components/VisitorTracker';

const CartContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'https://naripehnawa.com:7100';
const CART_KEY = 'nari_cart_guest';

const getToken = () =>
  localStorage.getItem('neel_token') || localStorage.getItem('token') || '';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ── Load cart ── */
  const loadCart = useCallback(async () => {
    if (user) {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCartItems(data.items || []);
          return;
        }
      } catch (e) {
        console.error('Cart load error:', e);
      }
    }
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCartItems(JSON.parse(saved));
    } catch (e) { }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Merge guest cart to backend upon login
  useEffect(() => {
    if (user) {
      const token = getToken();
      if (!token) return;
      
      const guestCartRaw = localStorage.getItem(CART_KEY);
      if (guestCartRaw) {
        try {
          const guestItems = JSON.parse(guestCartRaw);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            setLoading(true);
            fetch(`${API_URL}/cart/merge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ items: guestItems })
            }).then(res => {
              if (res.ok) {
                localStorage.removeItem(CART_KEY);
                console.log("Guest cart merged successfully.");
              }
              loadCart();
            }).catch(err => {
              console.error("Cart merge error:", err);
              loadCart();
            }).finally(() => {
              setLoading(false);
            });
            return;
          }
        } catch (e) {
          console.error("Failed to parse guest cart for merge:", e);
        }
      }
    }
  }, [user, loadCart]);

  /* ── Persist guest cart to localStorage ── */
  useEffect(() => {
    if (!user) {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  /* ── Add to cart ── */
  const addToCart = async (product) => {
    // product: { product_id, name, price, image, size, color, quantity }
    setLoading(true);
    try {
      if (user) {
        const token = getToken();
        const res = await fetch(`${API_URL}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(product),
        });
        if (res.ok) {
          trackCustomEvent("cart_add", {
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            size: product.size,
            color: product.color,
            quantity: product.quantity || 1
          });
          const data = await res.json();
          setCartItems(data.items || []);
          return true;
        }
        return false;
      }
      // Guest
      trackCustomEvent("cart_add", {
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        size: product.size,
        color: product.color,
        quantity: product.quantity || 1
      });
      setCartItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.product_id === product.product_id && i.size === product.size
        );
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + (product.quantity || 1) };
          return copy;
        }
        return [...prev, { ...product, quantity: product.quantity || 1 }];
      });
      return true;
    } catch (e) {
      console.error('addToCart error:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ── Update quantity ── */
  const updateQuantity = async (product_id, size, quantity) => {
    if (user) {
      const token = getToken();
      try {
        const res = await fetch(
          `${API_URL}/cart/item/${product_id}?size=${encodeURIComponent(size)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setCartItems(data.items || []);
          return;
        }
      } catch (e) {
        console.error('updateQuantity error:', e);
      }
    }
    setCartItems((prev) => {
      if (quantity <= 0)
        return prev.filter((i) => !(i.product_id === product_id && i.size === size));
      return prev.map((i) =>
        i.product_id === product_id && i.size === size ? { ...i, quantity } : i
      );
    });
  };

  /* ── Remove item ── */
  const removeItem = async (product_id, size) => {
    if (user) {
      const token = getToken();
      try {
        await fetch(
          `${API_URL}/cart/item/${product_id}?size=${encodeURIComponent(size)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (e) {
        console.error('removeItem error:', e);
      }
    }
    const item = cartItems.find((i) => i.product_id === product_id && i.size === size);
    if (item) {
      trackCustomEvent("cart_remove", {
        product_id: product_id,
        name: item.name,
        price: item.price,
        size: size,
        color: item.color,
        quantity: item.quantity || 1
      });
    }
    setCartItems((prev) =>
      prev.filter((i) => !(i.product_id === product_id && i.size === size))
    );
  };

  /* ── Clear cart ── */
  const clearCart = async () => {
    if (user) {
      const token = getToken();
      try {
        await fetch(`${API_URL}/cart/clear`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) { }
    }
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
  };

  const cartCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * (i.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        cartCount,
        cartTotal,
        loading,
        refreshCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
