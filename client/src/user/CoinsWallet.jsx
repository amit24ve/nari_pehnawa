import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Coins,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Gift,
  HelpCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";

const API_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const CoinsWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "credit" | "debit"

  const fetchWallet = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("neel_token") || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/coins/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Could not fetch coin wallet data");
      const data = await res.json();
      setWallet(data);
    } catch (err) {
      console.error("Wallet fetch error:", err);
      setError(err.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const balance = wallet?.coins_balance ?? 0;
  const rupeeValue = (balance / 10).toFixed(2);
  const earnedTotal = wallet?.coins_earned_total ?? 0;
  const spentTotal = wallet?.coins_spent_total ?? 0;
  const transactions = wallet?.transactions || [];

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "credit") return tx.type === "credit" || tx.type === "refund";
    if (activeTab === "debit") return tx.type === "debit" || tx.type === "reversal";
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading your Nari Pehnawa Reward Wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Coins className="w-6 h-6" />
            </span>
            Nari Pehnawa Reward Coins
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Earn coins on every product purchased and use them for discounts on your next orders!
          </p>
        </div>
        <button
          onClick={fetchWallet}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Balance
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Wallet Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1E1114] to-[#3B0A16] text-white p-6 sm:p-10 shadow-2xl border border-amber-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Nari Pehnawa Reward Member
            </div>

            <div>
              <p className="text-xs sm:text-sm text-gray-300 uppercase tracking-wider font-medium">
                Available Coin Balance
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl sm:text-6xl font-black tracking-tight text-amber-400">
                  {balance.toLocaleString()}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-amber-300/80">Coins</span>
              </div>
              <p className="text-sm sm:text-base text-gray-300 font-medium mt-1">
                ≈ <span className="text-emerald-400 font-bold">₹{rupeeValue}</span> Value (10 Coins = ₹1)
              </p>
            </div>

            <p className="text-xs text-amber-200/70 max-w-md">
              You can redeem these coins at checkout for instant discounts (up to 50% of order value).
            </p>
          </div>

          {/* Quick Action */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3">
            <Link
              to="/all"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 text-center"
            >
              <ShoppingBag className="w-4 h-4" /> Shop & Earn More Coins
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-gray-400 font-medium block">Lifetime Earned</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">
              +{earnedTotal.toLocaleString()} Coins
            </span>
            <span className="text-[11px] text-gray-400">₹{(earnedTotal / 10).toFixed(2)} worth</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-gray-400 font-medium block">Total Redeemed</span>
            <span className="text-lg sm:text-xl font-bold text-rose-400 mt-0.5 block">
              -{spentTotal.toLocaleString()} Coins
            </span>
            <span className="text-[11px] text-gray-400">₹{(spentTotal / 10).toFixed(2)} saved</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-xs text-gray-400 font-medium block">Redemption Rate</span>
            <span className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5 block">
              10 Coins = ₹1
            </span>
            <span className="text-[11px] text-gray-400">Max 50% order value</span>
          </div>
        </div>
      </div>

      {/* How it Works / Rules Cards */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" /> How Nari Pehnawa Coins Work
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              100🪙
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Regular Products</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Earn <span className="font-semibold text-gray-900 dark:text-gray-200">100 Coins</span> on every standard product you buy.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
              50🪙
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Offer / Sale Products</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Earn <span className="font-semibold text-gray-900 dark:text-gray-200">50 Coins</span> on products already on discount or sale.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              ₹1
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Instant Discounts</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Every <span className="font-semibold text-gray-900 dark:text-gray-200">10 Coins = ₹1</span> direct discount at checkout.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              50%
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Redeem Cap</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Use your coins to pay <span className="font-semibold text-gray-900 dark:text-gray-200">up to 50%</span> of total order value.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Coin Activity History
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete history of coins earned from purchases and redeemed on discounts.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("credit")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "credit"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Earned (+)
            </button>
            <button
              onClick={() => setActiveTab("debit")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "debit"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Spent (-)
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Coins className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-base">No coin transactions yet</h4>
            <p className="text-xs text-gray-500 max-w-sm">
              Place an order to start earning reward coins right away!
            </p>
            <Link
              to="/all"
              className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.coins > 0;
              const dateStr = tx.created_at
                ? new Date(tx.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Recent";

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isCredit
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {tx.description || (isCredit ? "Coins Credited" : "Coins Redeemed")}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{dateStr}</span>
                        {tx.order_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                              Order #{tx.order_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-base sm:text-lg font-bold block ${
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isCredit ? `+${tx.coins}` : tx.coins} Coins
                    </span>
                    <span className="text-xs text-gray-400">
                      ₹{(Math.abs(tx.coins) / 10).toFixed(2)} value
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinsWallet;
