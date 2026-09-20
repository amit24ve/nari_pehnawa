import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, ShieldCheck, Award, Headset, RefreshCw, Truck, MessageSquare, X, CheckCircle, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com/nari.pehnawa",
    brandColor: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    svg: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
  label: "Threads",
  href: "https://www.threads.net/@nari.pehnawa",
  brandColor: "#000000",
  svg: (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.5 2 3 5.76 3 11.91c0 6.22 3.52 10.09 9.18 10.09 4.66 0 7.69-2.63 7.69-6.69 0-3.87-2.58-6.02-6.42-6.02-2.04 0-3.53.65-4.42 1.91-.1-3.12 1.25-5.16 3.78-5.16 1.72 0 2.84.82 3.35 2.44l1.91-.74C17.34 5.1 15.25 3.57 12.04 3.57c-3.86 0-6.13 2.95-6.13 7.97 0 5.01 2.26 8.89 6.27 8.89 3.15 0 5.17-1.81 5.17-4.94 0-2.72-1.72-4.38-4.52-4.38-2.13 0-3.49.93-4.08 2.78-.24-.57-.36-1.22-.36-1.94 0-2.19 1.29-3.54 3.35-3.54 2.62 0 4.18 1.37 4.18 3.67 0 2.66-1.64 4.21-4.55 4.21-1.99 0-3.55-.86-4.34-2.39l-1.72.97c1.12 2.15 3.3 3.4 6.06 3.4 4.09 0 6.52-2.32 6.52-6.18 0-4.15-2.69-6.59-7.08-6.59-3.45 0-5.64 2.01-6.1 5.36C4.91 5.07 7.36 2 12.04 2z" />
    </svg>
  )
},
  {
    label: "Facebook",
    href: "https://facebook.com/naripehnawa",
    brandColor: "#1877F2",
    svg: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z" />
      </svg>
    )
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@nari.pehnawa",
    brandColor: "#FF0000",
    svg: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.556a3.002 3.002 0 0 0-2.11 2.107C0 8.028 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.556a3.002 3.002 0 0 0 2.11-2.107C24 15.972 24 12 24 12s0-3.972-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
];

const Footer = () => {
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "General Query",
    message: ""
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});
  }, []);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) return;

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.email || !payload.email.trim()) {
        payload.email = null;
      }
      const res = await fetch(`${API_BASE_URL}/inquiries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setShowInquiryModal(false);
          setFormData({ name: "", phone: "", email: "", subject: "General Inquiry", message: "" });
        }, 2500);
      } else {
        alert(data.detail || "Failed to submit inquiry");
      }
    } catch (err) {
      console.error("Inquiry submission error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative text-gray-900 font-sans border-t border-[#8B0000]/20 bg-cover bg-bottom bg-no-repeat"
      style={{
        backgroundImage: `url('/assets/footer_palace_bg.png')`,
        backgroundColor: "#fff6f4",
        backgroundSize: "cover",
        backgroundPosition: "bottom center"
      }}
    >
      {/* Gentle gradient tint so background image shows 100% clearly without any box enclosures */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-white/60 pointer-events-none"></div>

      {/* Dynamic styling for links & social buttons */}
      <style>{`
        .social-icon:hover {
          background: var(--hover-bg);
          color: white !important;
          border-color: transparent !important;
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(139, 0, 0, 0.25);
        }
        .footer-link:hover {
          color: #8B0000 !important;
          transform: translateX(3px);
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          1. MAIN FOOTER CONTENT (UN-BOXED DIRECTLY ON BACKGROUND)
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-10 pt-12 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-8">

          {/* ── Brand Column 1 (Spans 2 columns on mobile) ── */}
          <div className="col-span-2 sm:col-span-1 space-y-4 lg:pr-2">
            <div>
              <Link to="/" className="inline-block mb-2">
                <img
                  src="/logo.png"
                  alt="Nari Pehnawa"
                  className="h-[58px] w-auto object-contain filter brightness-100 drop-shadow-md"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </Link>
              <div className="text-[10px] tracking-[0.2em] text-[#8B0000] font-black uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                — Traditional Ka Tadka —
              </div>
            </div>

            <p className="text-xs md:text-sm text-[#3a0808] font-bold leading-relaxed drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              Nari Pehnawa is your one-stop destination for trendy, elegant &amp; comfortable ethnic wear.
            </p>

            {/* Social Icons */}
            <div className="flex gap-2 pt-1">
              {socials.map(({ label, href, brandColor, svg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="social-icon w-9 h-9 rounded-full flex items-center justify-center border border-[#8B0000]/30 text-gray-800 transition-all duration-300 bg-white/80 shadow-md"
                  style={{ "--hover-bg": brandColor }}
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* ── Shop Column 2 ── */}
          <div>
            <h4 style={headStyle}>Shop</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/new-arrivals"
                  className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to="/category/sale"
                  className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                >
                  Mega Sale Offers
                </Link>
              </li>
              {categories
                .filter((c) => {
                  const link = (c.link || "").toLowerCase();
                  const name = (c.name || "").toLowerCase();
                  return !link.includes("new-arrivals") && !link.includes("sale") && !name.includes("new") && !name.includes("sale");
                })
                .slice(0, 4)
                .map((cat) => (
                  <li key={cat._id || cat.id || cat.name}>
                    <Link
                      to={cat.link || `/category/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              {categories.length === 0 && (
                <>
                  <li>
                    <Link
                      to="/category/sleeveless-kurtis"
                      className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                    >
                      Sleeveless Kurtis
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/category/halter-neck-top"
                      className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                    >
                      Halter Neck Top
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* ── Help & Support Column 3 ── */}
          <div>
            <h4 style={headStyle}>Help &amp; Support</h4>
            <ul className="space-y-2.5">
              {[
                ["FAQs", "/support/faqs"],
                ["Track Order", "/track-order"],
                ["Size Guide", "/support/size-guide"],
                ["Returns & Exchange", "/support/returns-exchange"],
                ["Shipping & Delivery", "/support/shipping-delivery"],
              ].map(([label, path]) => (
                <li key={label}>
                  <Link
                    to={path}
                    className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── About Us Column 4 ── */}
          <div>
            <h4 style={headStyle}>About Us</h4>
            <ul className="space-y-2.5">
              {[
                ["Terms & Conditions", "/support/terms-conditions"],
                ["Refund Policy", "/support/refund-policy"],
              ].map(([label, path]) => (
                <li key={label}>
                  <Link
                    to={path}
                    className="footer-link text-xs md:text-sm text-[#3a0808] font-bold transition-all duration-300 inline-block no-underline drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact Info & Interactive Inquiry Modal Button Column 5 ── */}
          <div className="col-span-2 sm:col-span-1 space-y-6">
            <div className="space-y-2.5">
              <h4 style={headStyle}>Contact Us</h4>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#8B0000] flex-shrink-0 mt-0.5" />
                  <span className="text-[#3a0808] font-bold leading-relaxed drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    Nari Pehnawa,<br />Sultanpur, Uttar Pradesh, India, 228151
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#8B0000] flex-shrink-0" />
                  <a href="mailto:support@naripehnawa.com" className="text-[#3a0808] font-bold hover:text-[#8B0000] transition-colors drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                    support@naripehnawa.com
                  </a>
                </div>
              </div>

              {/* Inquiry Form Trigger Button */}
              <div className="pt-3">
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#8B0000] to-[#5c0000] hover:from-[#a52a2a] hover:to-[#8B0000] text-white text-xs font-black rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border border-[#d4af37]/40 uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                  <span>Submit Inquiry Form</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="border-t border-[#8B0000]/25 w-full"></div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. TRUST BADGES ROW (UN-BOXED DIRECTLY ON BACKGROUND)
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 justify-items-center">

          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">FREE SHIPPING</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">On first order</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">100% SECURE</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">Safe Checkout</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">PREMIUM QUALITY</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">Authentic Fabrics</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">EASY RETURNS</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">7 Days Exchange</div>
            </div>
          </div>

          <div className="flex items-center gap-3 col-span-2 sm:col-span-1 w-full max-w-[200px] justify-center lg:justify-start">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md">
              <Headset className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">24/7 SUPPORT</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">Always Available</div>
            </div>
          </div>

        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="border-t border-[#8B0000]/25 w-full"></div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. BOTTOM BAR (COPYRIGHT & PAYMENTS DIRECTLY ON BACKGROUND)
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-xs text-[#3a0808] font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
            <span>
              &copy; 2026 <span className="text-[#8B0000] font-black">Nari Pehnawa</span>. All Rights Reserved.
            </span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <div className="flex items-center gap-3">
              <Link to="/support/privacy-policy" className="hover:text-[#8B0000] transition-colors">Privacy Policy</Link>
              <span className="text-gray-400">|</span>
              <Link to="/support/terms-conditions" className="hover:text-[#8B0000] transition-colors">Terms</Link>
              <span className="text-gray-400">|</span>
              <Link to="/support/refund-policy" className="hover:text-[#8B0000] transition-colors">Refund Policy</Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="bg-white px-2 py-0.5 rounded flex items-center justify-center h-[24px] w-[38px] shadow-md select-none border border-gray-300">
              <span className="text-[10px] font-extrabold italic text-[#1A1F71]">VISA</span>
            </div>

            <div className="bg-white px-2 py-0.5 rounded flex items-center justify-center gap-0.5 h-[24px] w-[38px] shadow-md select-none border border-gray-300">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1.5 opacity-90" />
            </div>

            <div className="bg-white px-1.5 py-0.5 rounded flex items-center justify-center h-[24px] w-[38px] shadow-md select-none border border-gray-300">
              <span className="text-[8px] font-black text-[#0c70b6] tracking-tight uppercase">RuPay</span>
            </div>

            <div className="bg-white px-1.5 py-0.5 rounded flex items-center justify-center h-[24px] w-[38px] shadow-md select-none border border-gray-300">
              <span className="text-[10px] font-extrabold italic tracking-tighter text-[#0F6F57]">UPI</span>
            </div>

            <div className="bg-white px-1 py-0.5 rounded flex items-center justify-center h-[24px] w-[38px] shadow-md select-none border border-gray-300">
              <span className="text-[9px] font-bold text-[#00baf2] tracking-tighter">paytm</span>
            </div>

            <div className="bg-white px-1 py-0.5 rounded flex items-center justify-center h-[24px] w-[38px] shadow-md select-none border border-gray-300">
              <span className="text-[9px] font-bold text-gray-800 tracking-tighter">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">P</span>
                <span className="text-[#FBBC05]">a</span>
                <span className="text-[#34A853]">y</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-700 text-white select-none shadow-md border border-emerald-600">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.9c0-.76.53-1.42 1.28-1.53l6.5-.93a1.5 1.5 0 01.428 0l6.5.93a1.5 1.5 0 011.28 1.53v4.613c0 4.15-2.613 7.82-6.52 9.176a1.5 1.5 0 01-1.01 0c-3.907-1.357-6.52-5.026-6.52-9.176V4.9zm8.384 7.643a1 1 0 000-1.414L8.742 9.32a1 1 0 10-1.414 1.414l2.5 2.5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414l-4.293 4.293z" clipRule="evenodd" />
            </svg>
            <span className="text-[9.5px] font-black tracking-widest text-white uppercase leading-none">
              SSL SECURED
            </span>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. INQUIRY FORM MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative border-2 border-[#8B0000]/20">
            {/* Close Button */}
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-[#8B0000] uppercase tracking-wide">
                Nari Pehnawa Inquiry Form
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Have a question or custom order request? Submit your details &amp; our team will contact you shortly!
              </p>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-gray-900">Inquiry Submitted Successfully!</h4>
                <p className="text-xs text-gray-600">
                  Thank you for contacting Nari Pehnawa. Our team will review your inquiry and get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Inquiry Topic</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-semibold"
                  >
                    <option value="General Query">General Query</option>
                    <option value="Kurti Size & Fit">Kurti Sizing &amp; Fit Assistance</option>
                    <option value="Custom Stitching">Custom Stitching &amp; Measurement Request</option>
                    <option value="Order Tracking & Delivery">Order Status &amp; Delivery Help</option>
                    <option value="Return & Exchange">Return or Exchange Inquiry</option>
                    <option value="Payment & Refund">Payment or Refund Issue</option>
                    <option value="Bulk & Wholesale">Bulk Order &amp; Wholesale Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Message / Problem *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your question or requirements..."
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#8B0000] hover:bg-[#a52a2a] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Inquiry</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </footer>
  );
};

const headStyle = {
  fontSize: "12px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "#8B0000",
  marginBottom: "16px",
  textShadow: "0 1px 2px rgba(255, 255, 255, 0.9)"
};

export default Footer;
