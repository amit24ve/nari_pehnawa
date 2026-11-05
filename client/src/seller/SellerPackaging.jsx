import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageCheck,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  Sparkles,
  HelpCircle,
  FileText,
} from "lucide-react";
import sellerApi from "./sellerApi";
import { useSellerAuth } from "./SellerAuthContext";

const PACKAGING_SIZES = [
  {
    type: "Small Security Polybag (10 x 12 in)",
    ideal_for: "Blouses, Dupattas, Crop tops & small accessories",
    features: "Hot-melt adhesive, 60+ Micron tear-resistant, Nari Pehnawa branding",
  },
  {
    type: "Medium Security Polybag (12 x 16 in)",
    ideal_for: "Kurti sets, Straight suits, Silk stoles & daily wear",
    features: "Tamper-evident VOID tape, Waterproof, POD jacket for invoices",
  },
  {
    type: "Large Heavy Ethnic Polybag (14 x 18 in)",
    ideal_for: "Heavy Sarees, Anarkalis, Flared lehengas & Gowns",
    features: "Reinforced seams, Heavy gauge security film, Official NP Gold/Cyan logo",
  },
];

const SellerPackaging = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  // Request Polybags Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [bagType, setBagType] = useState("Medium Security Polybag (12 x 16 in)");
  const [quantity, setQuantity] = useState("100 Units");
  const [address, setAddress] = useState(
    seller?.address ? `${seller.address}, ${seller.city}, ${seller.state} - ${seller.pincode || ""}` : ""
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const data = await sellerApi.getPackagingPolicy();
        setPolicy(data);
      } catch (err) {
        console.error("Failed to load policy:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  const handleRequestBags = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const subject = `Packaging Polybags Request: ${quantity} (${bagType})`;
      const message = `Dear Nari Pehnawa Admin Team,\n\nPlease dispatch official security polybags for our store (${seller?.shop_name}).\n\n• Selected Bag Type: ${bagType}\n• Quantity Required: ${quantity}\n• Delivery Address: ${address}\n• Additional Remarks: ${notes || "None"}\n\nThank you,\n${seller?.name} (${seller?.shop_name})`;

      await sellerApi.createInquiry({
        category: "Packaging & Polybags Request",
        subject,
        message,
        priority: "medium",
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setModalOpen(false);
        navigate("/seller/inquiries");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit polybag request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-[#083344] to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
            <PackageCheck className="w-4 h-4" />
            <span>Nari Pehnawa Centralized Packaging System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official Packaging & Polythene System
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/80 leading-relaxed">
            Nari Pehnawa guarantees authentic luxury ethnic wear to customers nationwide. To maintain
            uniformity and courier transit safety, all garments must be shipped in our tamper-evident
            security polybags. Your verified brand remains on the garment tags, while the outer
            packaging represents Nari Pehnawa.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Order Packaging Polybags</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-cyan-200 bg-white/10 px-3 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-cyan-300" />
              <span>SLA: Dispatches & replies within 24 to 48 Hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Rules vs Packaging Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0891b2]" />
            <span>Packaging & Brand Separation Policy</span>
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  Garment Branding Belongs to You
                </strong>
                Internal fabric neck labels, size tags, and care tags can proudly carry your seller
                shop or brand name.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  Outer Courier Polybag Belongs to Nari Pehnawa
                </strong>
                All packages dispatched to customers must use official Nari Pehnawa branded
                tamper-evident courier bags. Non-standard bags will be rejected at courier pickup.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  Polybags Supplied by Nari Pehnawa
                </strong>
                You do not need to produce your own branded shipping bags. Simply request packs of 50,
                100, or 200 bags directly from this portal, delivered to your warehouse address.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">
                  Customer Return & Tamper Protection
                </strong>
                Each polybag features a unique VOID tamper indicator. If opened en-route, it cannot be
                re-sealed, protecting you from transit theft or fraudulent claims.
              </div>
            </div>
          </div>
        </div>

        {/* 5-Step Dispatch Protocol */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#0891b2]" />
            <span>Standard 5-Step Dispatch Protocol</span>
          </h2>

          <ol className="space-y-3">
            {[
              {
                step: 1,
                title: "Quality Check & Fold",
                desc: "Check stitching, buttons, and zippers. Fold neatly and place inside transparent inner sleeve.",
              },
              {
                step: 2,
                title: "Enclose in Nari Pehnawa Polybag",
                desc: "Insert the folded garment into the appropriately sized official Nari Pehnawa outer polybag.",
              },
              {
                step: 3,
                title: "Permanent Adhesive Seal",
                desc: "Peel off the protective adhesive film from the flap and press down firmly to create a permanent tamper-evident seal.",
              },
              {
                step: 4,
                title: "Insert Shipping Waybill",
                desc: "Print the generated Nari Pehnawa shipping label and slide it inside the transparent document POD jacket.",
              },
              {
                step: 5,
                title: "Carrier Handover",
                desc: "Hand over to the scheduled Shiprocket / Delhivery courier pickup executive during daily pickup slot.",
              },
            ].map((s) => (
              <li key={s.step} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                <span className="w-6 h-6 rounded-full bg-[#0891b2] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  {s.step}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Available Polybag Specifications */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Polybag Sizes Available</h2>
            <p className="text-xs text-slate-500">Provided in bundles of 50, 100, and 200 bags</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-xs font-bold text-[#0891b2] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Request Bags Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PACKAGING_SIZES.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 hover:border-[#0891b2] transition bg-slate-50/50 space-y-2"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0891b2] bg-cyan-50 px-2 py-0.5 rounded">
                Grade A Courier Spec
              </span>
              <h4 className="text-sm font-bold text-slate-900">{item.type}</h4>
              <p className="text-xs text-slate-600">
                <strong>Best For:</strong> {item.ideal_for}
              </p>
              <p className="text-[11px] text-slate-400">{item.features}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Request Packaging Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#0891b2]" />
                <h3 className="text-base font-bold text-slate-900">Request Packaging Polybags</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Request Submitted!</h4>
                <p className="text-xs text-slate-600">
                  Our admin team will dispatch your packaging bags within 24-48 hours. Redirecting to support ticket...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestBags} className="mt-4 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Polybag Size / Type *
                  </label>
                  <select
                    value={bagType}
                    onChange={(e) => setBagType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                  >
                    {PACKAGING_SIZES.map((s, idx) => (
                      <option key={idx} value={s.type}>
                        {s.type}
                      </option>
                    ))}
                    <option value="Mixed Bundle (50 Small + 50 Medium + 50 Large)">
                      Mixed Bundle (50 Small + 50 Medium + 50 Large)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Required *
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2] bg-white"
                  >
                    <option value="50 Units">50 Units</option>
                    <option value="100 Units">100 Units (Recommended)</option>
                    <option value="200 Units">200 Units</option>
                    <option value="500 Units">500 Units</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full warehouse address with pincode"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please deliver between 10am - 5pm"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-900 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Your request generates a tracked priority ticket in the Nari Pehnawa Admin Panel. Our logistics desk dispatches bags within 24 to 48 hours.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0891b2] hover:bg-[#0e7490] rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Polybag Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPackaging;

