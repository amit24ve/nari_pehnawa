import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getSellerToken,
  setSellerToken,
  getSellerStoredUser,
  setSellerStoredUser,
  sellerApi,
} from "./sellerApi";

const SellerAuthContext = createContext(null);

export const SellerAuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(() => getSellerStoredUser());
  const [token, setToken] = useState(() => getSellerToken());
  const [loading, setLoading] = useState(true);

  const refreshSeller = useCallback(async () => {
    const curToken = getSellerToken();
    if (!curToken) {
      setSeller(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await sellerApi.getMe();
      setSeller(data);
      setSellerStoredUser(data);
      return data;
    } catch (err) {
      console.warn("Failed to refresh seller profile:", err.message);
      // If token is invalid or seller not found
      if (err.message.includes("401") || err.message.includes("404") || err.message.toLowerCase().includes("unauthorized") || err.message.toLowerCase().includes("not found") || err.message.toLowerCase().includes("could not validate")) {
        setSellerToken("");
        setSellerStoredUser(null);
        setSeller(null);
        setToken("");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSeller();

    const handleSync = () => {
      setToken(getSellerToken());
      refreshSeller();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("np_seller_token_set", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("np_seller_token_set", handleSync);
    };
  }, [refreshSeller]);

  const login = async (email, password) => {
    const res = await sellerApi.login({ email, password });
    if (res.access_token) {
      setSellerToken(res.access_token);
      setToken(res.access_token);
      setSeller(res.seller);
      setSellerStoredUser(res.seller);
      return res.seller;
    }
    throw new Error("Login failed. No token received.");
  };

  const register = async (payload) => {
    const res = await sellerApi.register(payload);
    if (res.access_token) {
      setSellerToken(res.access_token);
      setToken(res.access_token);
      setSeller(res.seller);
      setSellerStoredUser(res.seller);
      return res.seller;
    }
    return res;
  };

  const logout = () => {
    setSellerToken("");
    setSellerStoredUser(null);
    setSeller(null);
    setToken("");
  };

  const value = {
    seller,
    token,
    loading,
    isAuthenticated: Boolean((token || getSellerToken()) && (seller || getSellerStoredUser())),
    login,
    register,
    logout,
    refreshSeller,
  };

  return (
    <SellerAuthContext.Provider value={value}>
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) {
    throw new Error("useSellerAuth must be used within a SellerAuthProvider");
  }
  return ctx;
};

export default SellerAuthContext;

