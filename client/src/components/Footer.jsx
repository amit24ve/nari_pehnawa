import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, ShieldCheck, Award, Headset, RefreshCw, Truck, MessageSquare, X, CheckCircle, Loader2, Sparkles, Briefcase, Phone, Users, Store, FileText } from "lucide-react";

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
  },
  {
    label: "WhatsApp Channel",
    href: "https://whatsapp.com/channel/0029VbCu9jxDeON5w0sPmD2n",
    brandColor: "#25D366",
    svg: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.961.815 2.796.815 3.183 0 5.769-2.587 5.77-5.766.001-3.182-2.585-5.77-5.77-5.772zm3.374 8.211c-.14.394-.716.741-1.002.784-.27.04-.616.071-1.782-.416-1.492-.622-2.451-2.138-2.525-2.237-.074-.099-.607-.808-.607-1.543s.385-1.096.522-1.246c.137-.15.299-.187.399-.187.1 0 .2.001.287.006.091.005.213-.035.333.253.124.298.423 1.031.46 1.106.037.075.062.162.012.261-.05.099-.075.161-.149.248-.075.087-.157.194-.224.261-.075.075-.153.156-.066.305.087.149.387.638.831 1.033.571.508 1.053.665 1.202.74.149.074.237.062.324-.037.087-.099.373-.435.473-.584.099-.149.2-.124.336-.075.137.05.867.409 1.018.484.15.075.25.112.287.199.037.087.037.509-.103.903zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2 22l4.954-1.399C8.396 21.499 10.144 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.636 0-3.154-.486-4.425-1.321l-.317-.208-2.956.775.789-2.88-.228-.363C3.966 14.898 3.5 13.486 3.5 12c0-4.687 3.813-8.5 8.5-8.5 4.687 0 8.5 3.813 8.5 8.5 0 4.687-3.813 8.5-8.5 8.5z" />
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
    message: "",
    inquiry_type: "general"
  });

  // Seller Partner Inquiry Modal States
  const [showSellerInquiryModal, setShowSellerInquiryModal] = useState(false);
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [sellerSubmitted, setSellerSubmitted] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    city: "",
    category: "Kurtis & Suits",
    seller_type: "Manufacturer",
    gst_status: "Yes",
    monthly_capacity: "200 – 500 Pieces",
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
      .catch(() => { });

    const handleOpenInquiry = () => setShowSellerInquiryModal(true);
    window.addEventListener("np_open_seller_inquiry", handleOpenInquiry);
    return () => window.removeEventListener("np_open_seller_inquiry", handleOpenInquiry);
  }, []);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email && formData.email.trim() ? formData.email.trim() : null,
        subject: formData.subject || "General Customer Inquiry",
        inquiry_type: formData.inquiry_type || "general",
        message: formData.message.trim() || "General Customer Inquiry"
      };

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
          setFormData({
            name: "",
            phone: "",
            email: "",
            subject: "General Query",
            message: "",
            inquiry_type: "general"
          });
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

  const handleSellerInquirySubmit = async (e) => {
    e.preventDefault();
    if (!sellerForm.contact_name.trim() || !sellerForm.phone.trim()) return;

    setSellerSubmitting(true);
    try {
      const payload = {
        name: sellerForm.contact_name.trim(),
        phone: sellerForm.phone.trim(),
        email: sellerForm.email?.trim() || null,
        business_name: sellerForm.business_name.trim(),
        shop_name: sellerForm.business_name.trim(),
        category: sellerForm.category,
        city: sellerForm.city.trim(),
        seller_type: sellerForm.seller_type,
        gst_status: sellerForm.gst_status,
        monthly_capacity: sellerForm.monthly_capacity,
        subject: `Seller Partner Inquiry: ${sellerForm.business_name.trim() || sellerForm.contact_name.trim()}`,
        inquiry_type: "seller",
        message: sellerForm.message.trim() || `Seller inquiry submitted by ${sellerForm.contact_name} for ${sellerForm.business_name || 'Ethnic Business'} (${sellerForm.category}, ${sellerForm.seller_type}) in ${sellerForm.city}.`
      };

      const res = await fetch(`${API_BASE_URL}/inquiries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSellerSubmitted(true);
        setTimeout(() => {
          setSellerSubmitted(false);
          setShowSellerInquiryModal(false);
          setSellerForm({
            business_name: "",
            contact_name: "",
            phone: "",
            email: "",
            city: "",
            category: "Kurtis & Suits",
            seller_type: "Manufacturer",
            gst_status: "Yes",
            monthly_capacity: "200 – 500 Pieces",
            message: ""
          });
        }, 2800);
      } else {
        alert(data.detail || "Failed to submit seller inquiry");
      }
    } catch (err) {
      console.error("Seller inquiry error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSellerSubmitting(false);
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
                ["Our Brand Story & About Us", "/about-us"],
                ["Meet The Founder", "/owner"],
                ["Terms & Conditions", "/support/terms-conditions"],
                ["Refund Policy", "/support/refund-policy"],
                ["Sell on Nari Pehnawa (Seller Hub)", "/seller/dashboard"],
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

              {/* Seller Partner Inquiry Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setShowSellerInquiryModal(true)}
                  className="w-full py-2.5 px-4 bg-[#8B0000] hover:bg-[#700000] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 border border-[#8B0000] tracking-wide cursor-pointer"
                  title="Submit your seller requirements to partner with Nari Pehnawa"
                >
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                  <span>Inquiry on Seller</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 justify-items-center">

          <div className="flex items-center gap-3 w-full max-w-[240px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">AUTHENTIC FABRICS</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">100% Pure Handcrafted</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[240px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">100% SECURE</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">Encrypted Safe Checkout</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[240px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">PREMIUM QUALITY</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">Traditional Ka Tadka</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[240px]">
            <div className="p-2.5 rounded-full bg-[#8B0000] text-white border border-[#8B0000] shadow-md flex-shrink-0">
              <Headset className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-[#8B0000] uppercase tracking-wider leading-none mb-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">24/7 SUPPORT</div>
              <div className="text-[10px] text-[#3a0808] font-extrabold leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">Dedicated Customer Care</div>
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

          {/* Direct Seller Registration Button (Shifted far left to guarantee zero overlap with floating chat widget) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("np_open_seller_register"))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B0000] hover:bg-[#700000] text-white text-xs font-bold shadow-sm hover:shadow transition-all border border-[#8B0000] cursor-pointer tracking-wide whitespace-nowrap mr-28 sm:mr-32 md:mr-36 lg:mr-44"
            title="Register directly as a verified seller on Nari Pehnawa"
          >
            <Store className="w-4 h-4 text-[#d4af37]" />
            <span>Register as Seller</span>
          </button>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. CUSTOMER INQUIRY FORM MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative border-2 border-[#8B0000]/30">
            {/* Close Button */}
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8B0000]/10 text-[#8B0000] mb-2 border border-[#d4af37]/50 shadow-inner">
                <MessageSquare className="w-6 h-6 text-[#8B0000]" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-[#8B0000] uppercase tracking-wide">
                Nari Pehnawa Inquiry Form
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                Have a question, bulk order request, or sizing assistance inquiry? Submit your details &amp; our team will contact you shortly!
              </p>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-gray-900">
                  Inquiry Submitted Successfully!
                </h4>
                <p className="text-xs text-gray-600">
                  Thank you for contacting Nari Pehnawa. Our support team will review your inquiry and get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3.5">
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile / WhatsApp *</label>
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
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Your Message / Question *
                  </label>
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
                  className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#5c0000] hover:from-[#a52a2a] hover:to-[#8B0000] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-[#d4af37]/50"
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

      {/* ══════════════════════════════════════════════════════════════
          5. SELLER PARTNER INQUIRY FORM MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showSellerInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-5 sm:p-7 relative border border-gray-200 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowSellerInquiryModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-5 sm:mb-6 pr-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8B0000]/10 text-[#8B0000] mb-2 border border-[#8B0000]/20 shadow-xs">
                <Store className="w-6 h-6 text-[#8B0000]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#8B0000] tracking-tight">
                Seller Partner Inquiry
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto leading-relaxed">
                Want to sell ethnic wear on Nari Pehnawa? Submit your business profile &amp; supply requirements. Our merchant onboarding team will connect with you.
              </p>
            </div>

            {sellerSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-gray-900">
                  Seller Inquiry Submitted!
                </h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Thank you! Our seller onboarding specialist will review your requirements and reach out via Phone / WhatsApp within 24 hours to guide you through catalog listing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSellerInquirySubmit} className="space-y-3.5">
                {/* Row 1: Brand / Business Name & Contact Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Brand / Business Name <span className="text-[#8B0000]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sellerForm.business_name}
                      onChange={(e) => setSellerForm({ ...sellerForm, business_name: e.target.value })}
                      placeholder="e.g. Radhika Ethnic Creation"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Contact Person Name <span className="text-[#8B0000]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sellerForm.contact_name}
                      onChange={(e) => setSellerForm({ ...sellerForm, contact_name: e.target.value })}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Row 2: Mobile/WhatsApp & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Mobile / WhatsApp Number <span className="text-[#8B0000]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={sellerForm.phone}
                      onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={sellerForm.email}
                      onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                      placeholder="business@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Row 3: City/State & Primary Product Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      City &amp; State <span className="text-[#8B0000]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sellerForm.city}
                      onChange={(e) => setSellerForm({ ...sellerForm, city: e.target.value })}
                      placeholder="e.g. Jaipur, Rajasthan / Surat"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Primary Product Category <span className="text-[#8B0000]">*</span>
                    </label>
                    <select
                      value={sellerForm.category}
                      onChange={(e) => setSellerForm({ ...sellerForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-semibold cursor-pointer"
                    >
                      <option value="Kurtis & Suits">Kurtis &amp; Suit Sets</option>
                      <option value="Sarees & Lehengas">Sarees &amp; Party Lehengas</option>
                      <option value="Ethnic Bottomwear">Ethnic Bottomwear &amp; Pants</option>
                      <option value="Handloom & Fabrics">Handloom &amp; Pure Silk Fabrics</option>
                      <option value="Jewellery & Accessories">Jewellery &amp; Accessories</option>
                      <option value="Footwear">Juttis &amp; Ethnic Footwear</option>
                      <option value="Other Ethnic Wear">Other Ethnic Collections</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Business Type & GSTIN Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Business Type <span className="text-[#8B0000]">*</span>
                    </label>
                    <select
                      value={sellerForm.seller_type}
                      onChange={(e) => setSellerForm({ ...sellerForm, seller_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-semibold cursor-pointer"
                    >
                      <option value="Manufacturer">Manufacturer / Factory</option>
                      <option value="Wholesaler">Wholesaler / Trader</option>
                      <option value="Boutique Owner">Boutique Owner / Retailer</option>
                      <option value="Handloom Weaver / Artisan">Handloom Artisan / Weaver</option>
                      <option value="Fashion Designer">Independent Fashion Designer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Do you have GSTIN?
                    </label>
                    <select
                      value={sellerForm.gst_status}
                      onChange={(e) => setSellerForm({ ...sellerForm, gst_status: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-semibold cursor-pointer"
                    >
                      <option value="Yes">Yes, Registered with GSTIN</option>
                      <option value="Applied">Applied for GSTIN</option>
                      <option value="No">No / Not Yet</option>
                      <option value="Composition">Composition Scheme</option>
                    </select>
                  </div>
                </div>

                {/* Supply Capacity */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Monthly Supply / Production Capacity
                  </label>
                  <select
                    value={sellerForm.monthly_capacity}
                    onChange={(e) => setSellerForm({ ...sellerForm, monthly_capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-semibold cursor-pointer"
                  >
                    <option value="50 – 200 Pieces">50 – 200 Pieces / Month</option>
                    <option value="200 – 500 Pieces">200 – 500 Pieces / Month</option>
                    <option value="500 – 2000 Pieces">500 – 2,000 Pieces / Month</option>
                    <option value="2000+ Bulk Production">2,000+ Bulk Production / Month</option>
                  </select>
                </div>

                {/* Requirements & Questions */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Requirements / Inquiry Details <span className="text-[#8B0000]">*</span>
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={sellerForm.message}
                    onChange={(e) => setSellerForm({ ...sellerForm, message: e.target.value })}
                    placeholder="Tell us about your products, commission queries, shipping pickup requirements, or catalog questions..."
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8B0000] focus:bg-white font-medium leading-relaxed"
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSellerInquiryModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sellerSubmitting}
                    className="px-6 py-2.5 bg-[#8B0000] hover:bg-[#700000] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {sellerSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <span>Submit Seller Inquiry</span>
                    )}
                  </button>
                </div>
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
