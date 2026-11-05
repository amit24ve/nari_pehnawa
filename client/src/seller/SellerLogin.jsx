import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, Store, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useSellerAuth } from "./SellerAuthContext";
import logoImg from "../assets/logo.png";

const SellerLogin = () => {
  const { login } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const destination = location.state?.from || "/seller/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Nari Pehnawa" className="h-12 w-auto object-contain" />
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Seller Partner Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Sign in to manage your products, packaging & inquiries
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {/* Quick One-Click Demo Seller Login Card */}
          <div className="mb-6 p-4 rounded-xl bg-cyan-50/80 border border-cyan-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[#0891b2] flex items-center gap-1.5">
                <Store className="w-4 h-4" />
                <span>Instant Demo Seller Login</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail("testseller@naripehnawa.com");
                  setPassword("Password@123");
                }}
                className="text-[11px] font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] px-2.5 py-1 rounded-lg transition shadow-xs cursor-pointer"
              >
                Auto-Fill Credentials
              </button>
            </div>
            <p className="text-[11px] text-cyan-900 leading-relaxed">
              Email: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-cyan-200">testseller@naripehnawa.com</code>
              <br className="sm:hidden" /> Password: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-cyan-200">Password@123</code>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0891b2] shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Seller Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <p className="text-center text-sm text-slate-600">
              New merchant on Nari Pehnawa?{" "}
              <Link
                to="/seller/register"
                className="font-bold text-[#0891b2] hover:underline"
              >
                Register as a Seller
              </Link>
            </p>
            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Return to Nari Pehnawa Store</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-800">Direct Store Listing</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Your products live on Nari Pehnawa</p>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-800">NP Security Packaging</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Official polybags provided</p>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-800">24-48h Support SLA</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct admin inquiry desk</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;

