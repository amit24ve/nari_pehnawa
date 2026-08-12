import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthProvider";
import { trackCustomEvent } from "../components/VisitorTracker";

const WishlistContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";
const WISHLIST_KEY = "nari_wishlist_guest";

const getToken = () =>
  localStorage.getItem("neel_token") || localStorage.getItem("token") || "";

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  /* ── Load wishlist ── */
  const loadWishlist = useCallback(async () => {
    if (user) {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/wishlist/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // data is array of wishlist items with optional product field
          const items = data.map((entry) => {
            const prod = entry.product || {};
            return {
              id: entry.product_id,
              wishlist_entry_id: entry.id,
              name: prod.name || "Product",
              price: prod.price || 0,
              originalPrice: prod.original_price || prod.originalPrice || null,
              image: prod.image || prod.images?.[0] || "",
              brand: prod.brand || "Nari Pehnawa",
              discount: prod.discount || null,
              onSale: prod.on_sale || false,
              category: prod.category || "",
            };
          });
          setWishlist(items);
          return;
        }
      } catch (e) {
        console.error("Wishlist load error:", e);
      }
    }
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      if (saved) setWishlist(JSON.parse(saved));
    } catch (e) { }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Merge guest wishlist to backend upon login
  useEffect(() => {
    if (user) {
      const token = getToken();
      if (!token) return;

      const guestWishlistRaw = localStorage.getItem(WISHLIST_KEY);
      if (guestWishlistRaw) {
        try {
          const guestItems = JSON.parse(guestWishlistRaw);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            const productIds = guestItems.map((item) => item.id).filter(Boolean);
            if (productIds.length > 0) {
              fetch(`${API_URL}/wishlist/merge`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ product_ids: productIds }),
              }).then((res) => {
                if (res.ok) {
                  localStorage.removeItem(WISHLIST_KEY);
                  console.log("Guest wishlist merged successfully.");
                }
                loadWishlist();
              }).catch((err) => {
                console.error("Wishlist merge error:", err);
                loadWishlist();
              });
              return;
            }
          }
        } catch (e) {
          console.error("Failed to parse guest wishlist for merge:", e);
        }
      }
    }
  }, [user, loadWishlist]);

  /* ── Persist guest wishlist ── */
  useEffect(() => {
    if (!user) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  /* ── Add to wishlist ── */
  const addToWishlist = async (product) => {
    if (user) {
      const token = getToken();
      try {
        const res = await fetch(`${API_URL}/wishlist/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: product.id }),
        });
        if (res.ok || res.status === 400) {
          // 400 means already in wishlist - that's fine
          const isAlready = wishlist.some((i) => i.id === product.id);
          if (!isAlready) setWishlist((prev) => [...prev, product]);
          return;
        }
      } catch (e) {
        console.error("addToWishlist error:", e);
      }
    }
    trackCustomEvent("wishlist_add", {
      product_id: product.id,
      name: product.name,
      price: product.price,
      category: product.category || ""
    });
    setWishlist((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  /* ── Remove from wishlist ── */
  const removeFromWishlist = async (productId) => {
    if (user) {
      const token = getToken();
      try {
        await fetch(`${API_URL}/wishlist/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error("removeFromWishlist error:", e);
      }
    }
    trackCustomEvent("wishlist_remove", {
      product_id: productId
    });
    setWishlist((prev) => prev.filter((i) => i.id !== productId));
  };

  const isInWishlist = (productId) => wishlist.some((i) => i.id === productId);

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = async () => {
    if (user) {
      const token = getToken();
      try {
        await fetch(`${API_URL}/wishlist/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) { }
    }
    setWishlist([]);
    localStorage.removeItem(WISHLIST_KEY);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
        refreshWishlist: loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};

export default WishlistContext;
