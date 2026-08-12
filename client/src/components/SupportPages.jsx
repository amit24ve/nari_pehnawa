import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Mail, MapPin, CheckCircle, HelpCircle, FileText, Truck, ShieldAlert, Award, CreditCard, Ruler, RefreshCw, Star, Info, Send } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const supportTopics = [
  { slug: "contact-us", label: "Contact Us", icon: Mail },
  { slug: "faqs", label: "FAQs", icon: HelpCircle },
  { slug: "shipping-delivery", label: "Shipping & Delivery", icon: Truck },
  { slug: "returns-exchange", label: "Returns & Exchange", icon: RefreshCw },
  { slug: "size-guide", label: "Size Guide", icon: Ruler },
  { slug: "payment-options", label: "Payment Options", icon: CreditCard },
  { slug: "cancellation-policy", label: "Cancellation Policy", icon: ShieldAlert },
  { slug: "privacy-policy", label: "Privacy Policy", icon: FileText },
  { slug: "terms-conditions", label: "Terms & Conditions", icon: FileText },
  { slug: "refund-policy", label: "Refund Policy", icon: FileText },
  { slug: "about-us", label: "About Us", icon: Info },
  { slug: "become-a-seller", label: "Become a Seller", icon: Star },
];

export default function SupportPages() {
  const { pageType } = useParams();
  const navigate = useNavigate();
  const activeTab = pageType || "contact-us";

  // Form states
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", subject: "General Inquiry", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sellerForm, setSellerForm] = useState({ name: "", email: "", phone: "", brand: "", message: "" });
  const [sellerSubmitted, setSellerSubmitted] = useState(false);

  // FAQ accordion states
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormSubmitted(true);
        setContactForm({ name: "", phone: "", email: "", subject: "General Inquiry", message: "" });
        setTimeout(() => setFormSubmitted(false), 5000);
      } else {
        alert(data.detail || "Failed to send message");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellerSubmit = (e) => {
    e.preventDefault();
    if (sellerForm.name && sellerForm.email && sellerForm.brand) {
      setSellerSubmitted(true);
      setSellerForm({ name: "", email: "", phone: "", brand: "", message: "" });
      setTimeout(() => setSellerSubmitted(false), 5000);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "contact-us":
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Get in Touch with Us</h2>
              <p className="text-gray-600">Have questions about our ethnic collection, orders, or sizing? We'd love to help.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-serif">Send Us a Message</h3>
                {formSubmitted && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-2.5 text-sm font-medium">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                    <span>Thank you! Your inquiry message has been submitted to Admin. We will get back to you shortly.</span>
                  </div>
                )}
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#8B0000] transition-colors font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#8B0000] transition-colors font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email (Optional)</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="e.g. aditi@example.com"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#8B0000] transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="e.g. Order Status, Sizing Query"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#8B0000] transition-colors font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Message *</label>
                    <textarea
                      rows="4"
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we help you today?"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#8B0000] transition-colors resize-none font-medium"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#8B0000] hover:bg-[#a52a2a] text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Send Message"}
                  </button>
                </form>
              </div>

              {/* Info Cards */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white text-[#8B0000] border border-gray-100 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 font-serif mb-1">Our Location</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      Nari Pehnawa,<br />Baisiya, Sultanpur, Uttar Pradesh, India, 228151
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white text-[#E95E82] border border-gray-100 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 font-serif mb-1">Support Email</h4>
                    <a href="mailto:support@naripehnawa.com" className="text-sm text-[#E95E82] hover:underline font-medium">
                      support@naripehnawa.com
                    </a>
                    <p className="text-xs text-gray-400 mt-1">We respond to most emails within 24 business hours.</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white text-[#E95E82] border border-pink-100 shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 font-serif mb-1">100% Authentic ethnic wear</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      All products showcased on Nari Pehnawa are crafted directly by skilled artisans under strict quality controls.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "faqs":
        const faqs = [
          { q: "How can I track my order?", a: "Once your order is shipped, we will send you an email and SMS containing tracking details. You can also log in to your account and go to 'Track Order' under the profile menu to see live delivery updates." },
          { q: "Is shipping free on my first order?", a: "Yes, shipping is absolutely free on your first order! For subsequent orders, we offer free shipping on all orders valued above ₹999. For orders below ₹999, a flat shipping fee of ₹99 is charged." },
          { q: "What is your return & exchange policy?", a: "We offer a hassle-free 7-day return and exchange policy on most of our products. The items must be unused, unwashed, and in their original packaging with price tags intact. Refunds are credited back to your payment mode within 5-7 business days." },
          { q: "How do I choose the correct size?", a: "Please refer to our Size Guide tab, which lists chest, waist, and hip measurements for XS, S, M, L, XL, and XXL sizes. We recommend measuring yourself before placing an order to get the perfect fit." },
          { q: "What payment options are available?", a: "We accept all major Credit/Debit Cards, Net Banking, UPI (PhonePe, GPay, Paytm), and Cash on Delivery (COD)." },
          { q: "Can I cancel my order?", a: "You can cancel your order within 12 hours of placing it or before it has been dispatched, whichever is earlier. Go to My Orders, select the order, and click 'Cancel'." },
        ];
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600">Quick answers to common questions about orders, payments, shipping, and returns.</p>
            </div>

            <div className="space-y-3.5">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="font-bold text-gray-900 text-sm font-serif">{faq.q}</span>
                    <span className={`text-[#E95E82] font-semibold text-lg transform transition-transform duration-200 ${openFaqIndex === i ? "rotate-45" : ""}`}>+</span>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${openFaqIndex === i ? "max-h-[200px] border-t border-gray-50" : "max-h-0"} overflow-hidden`}>
                    <p className="p-6 text-sm text-gray-600 leading-relaxed bg-gray-50/30">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "shipping-delivery":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Shipping & Delivery Policy</h2>
              <p className="text-gray-600">We are committed to delivering your orders quickly, safely, and efficiently.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 font-serif">Shipping Rates</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>First Order:</strong> Free shipping is automatically applied to your very first order, regardless of the cart total!</li>
                  <li><strong>Subsequent Orders (Above ₹999):</strong> Free shipping across India.</li>
                  <li><strong>Subsequent Orders (Below ₹999):</strong> Flat shipping fee of ₹99 is applicable.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 font-serif">Delivery Timelines</h3>
                <p>We process all orders within 24-48 business hours. Expected delivery timelines are as follows:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Metro Cities:</strong> 3-5 business days.</li>
                  <li><strong>Rest of India:</strong> 5-7 business days.</li>
                  <li><strong>Remote Locations:</strong> Up to 7-10 business days.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-gray-900 font-serif">Delayed Shipments</h3>
                <p>In rare situations like severe weather condition, regional lockdowns, or peak festive season, delivery might take longer. We ask for your patience. Rest assured, your order will reach you safe and secure.</p>
              </div>
            </div>
          </div>
        );

      case "returns-exchange":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Returns & Exchange Policy</h2>
              <p className="text-gray-600">Changed your mind or got the wrong size? We offer a super easy 7-day return policy.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 font-serif">Step-by-Step Return Process</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Go to <strong>My Orders</strong>, select the item you wish to return, and click <strong>Return</strong>.</li>
                  <li>Select the reason for return and choose if you want a size exchange or a refund.</li>
                  <li>Pack the product securely in its original package. Ensure price tags, labels, and invoice copy are intact.</li>
                  <li>Our delivery partner will arrive within 2-3 business days to pick up the item.</li>
                  <li>Once the product reaches our warehouse and passes QC inspection, the refund or exchange will be initiated immediately.</li>
                </ol>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-gray-900 font-serif">Non-Returnable Items</h3>
                <p>Custom customized outfits, accessories, and items purchased during clearance/end-of-season sales are not eligible for returns or exchanges unless received in damaged condition.</p>
              </div>
            </div>
          </div>
        );

      case "size-guide":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Size Guide</h2>
              <p className="text-gray-600">Find your perfect fit. Please measure yourself using a tape before selecting size.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-serif mb-3">Kurtis & Dresses Size Chart (Inches)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-gray-600">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-900 bg-gray-50">
                        <th className="py-3 px-4 font-bold">Size</th>
                        <th className="py-3 px-4 font-bold">Chest</th>
                        <th className="py-3 px-4 font-bold">Waist</th>
                        <th className="py-3 px-4 font-bold">Hips</th>
                        <th className="py-3 px-4 font-bold">Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <tr><td className="py-3 px-4 font-semibold text-gray-900">XS</td><td className="py-3 px-4">32</td><td className="py-3 px-4">26</td><td className="py-3 px-4">36</td><td className="py-3 px-4">44</td></tr>
                      <tr><td className="py-3 px-4 font-semibold text-gray-900">S</td><td className="py-3 px-4">34</td><td className="py-3 px-4">28</td><td className="py-3 px-4">38</td><td className="py-3 px-4">44</td></tr>
                      <tr><td className="py-3 px-4 font-semibold text-gray-900">M</td><td className="py-3 px-4">36</td><td className="py-3 px-4">30</td><td className="py-3 px-4">40</td><td className="py-3 px-4">44.5</td></tr>
                      <tr><td className="py-3 px-4 font-semibold text-gray-900">L</td><td className="py-3 px-4">38</td><td className="py-3 px-4">32</td><td className="py-3 px-4">42</td><td className="py-3 px-4">45</td></tr>
                      <tr><td className="py-3 px-4 font-semibold text-gray-900">XL</td><td className="py-3 px-4">40</td><td className="py-3 px-4">34</td><td className="py-3 px-4">44</td><td className="py-3 px-4">45.5</td></tr>
                      <tr><td className="py-3 px-4 font-semibold text-gray-900">XXL</td><td className="py-3 px-4">42</td><td className="py-3 px-4">36</td><td className="py-3 px-4">46</td><td className="py-3 px-4">46</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 font-serif mb-3">How to Measure</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
                  <li><strong>Waist:</strong> Measure around the narrowest part of your waist, just above your belly button.</li>
                  <li><strong>Hips:</strong> Measure around the widest part of your hips.</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case "payment-options":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Payment Options</h2>
              <p className="text-gray-600">Secure, safe transactions. We prioritize payment protection for all our customers.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 font-serif">Accepted Modes of Payment</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>UPI Apps:</strong> Pay via Google Pay, PhonePe, Paytm, BHIM UPI directly.</li>
                  <li><strong>Cards:</strong> All major Credit & Debit cards (Visa, Mastercard, RuPay) are supported.</li>
                  <li><strong>Net Banking:</strong> Pay securely using net banking access from major Indian banks.</li>
                  <li><strong>Cash on Delivery (COD):</strong> Available on orders up to ₹5000. Flat ₹49 COD handling fee applies.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-gray-900 font-serif">Payment Security</h3>
                <p>We process all online transactions via PCI-DSS compliant, fully encrypted payment gateways (Razorpay/Paytm). Your bank details and passwords are 100% safe and are never stored on our servers.</p>
              </div>
            </div>
          </div>
        );

      case "cancellation-policy":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Cancellation Policy</h2>
              <p className="text-gray-600">Please review guidelines if you wish to cancel an order.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-gray-900 font-serif">Before Dispatch</h3>
                <p>You can cancel your order within 12 hours of placing it or before it has been dispatched, whichever is earlier. Go to My Orders, select the order, and click 'Cancel'. We will refund the full amount instantly.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-gray-900 font-serif">After Dispatch</h3>
                <p>Orders that have already been dispatched from our facility cannot be cancelled. However, you may choose to refuse the delivery when the courier partner attempts drop-off. Once the returned pack reaches us, we will process a refund minus shipping expenses.</p>
              </div>
            </div>
          </div>
        );

      case "privacy-policy":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Privacy Policy</h2>
              <p className="text-gray-600">Your privacy is highly valuable to us. We secure your personal data with standard encryptions.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 font-serif">Information We Collect</h3>
              <p>We collect essential information to fulfill your orders, manage accounts, and improve custom store features, including name, phone number, shipping address, email, and browsing behavior details.</p>

              <h3 className="text-base font-bold text-gray-900 font-serif">Data Protection</h3>
              <p>We do not sell, rent, or lease your personal information to third parties. We use secure databases, firewalls, and secure socket layers (SSL) to guard all customer details.</p>
            </div>
          </div>
        );

      case "terms-conditions":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Terms & Conditions</h2>
              <p className="text-gray-600">Please read our service guidelines carefully before using Nari Pehnawa.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 font-serif">Usage Guidelines</h3>
              <p>By visiting, registering, or making a purchase on Nari Pehnawa, you agree to comply with our general shipping, return, and cancellation policies outlined on the store.</p>

              <h3 className="text-base font-bold text-gray-900 font-serif">Product Visuals</h3>
              <p>We make every effort to display product colors and designs as accurately as possible. However, actual colors may slightly differ based on your screen display contrast or photography lighting.</p>
            </div>
          </div>
        );

      case "refund-policy":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Refund Policy</h2>
              <p className="text-gray-600">Understand return credits, timelines, and refund dispatch procedures.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 font-serif">Refund Timelines</h3>
                <p>Refunds are initiated only after the returned items have reached our warehouse and passed the quality control inspection. The money is credited back to your account via the original mode of payment within:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Net Banking/Credit Card/Debit Card:</strong> 5-7 business days.</li>
                  <li><strong>UPI Payments:</strong> 2-3 business days.</li>
                  <li><strong>COD Orders:</strong> We will request your bank account details or UPI ID. Refund is initiated within 3-5 days of receiving bank details.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-gray-900 font-serif">Defective/Damaged Items</h3>
                <p>If you receive a defective or damaged product, notify us within 24 hours of delivery at support@naripehnawa.com with tags, invoice copy, and clear photographs. We will process an exchange or full refund at no additional fee.</p>
              </div>
            </div>
          </div>
        );

      case "about-us":
        return (
          <div className="space-y-6 animate-fadeIn text-sm text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">About Nari Pehnawa</h2>
              <p className="text-gray-600">Welcome to the home of authentic ethnic craftsmanship.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <p>Nari Pehnawa started with a simple vision: to bring top-notch ethnic styling to every woman across India. From simple casual printed Kurtis to heavy luxury Lehenga sets, our collection celebrates Indian traditional craftsmanship with modern comfort styles.</p>
              <p>We work closely with local artisans to source pure cottons, georgettes, silk, and block-prints. Every design goes through a meticulous quality audit before shipping out, ensuring you receive an elegant outfit that makes you shine.</p>
            </div>
          </div>
        );

      case "become-a-seller":
        return (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Partner with Us</h2>
              <p className="text-gray-600 text-sm">Grow your business and showcase your authentic designs on Nari Pehnawa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-serif">Seller Registration Inquiry</h3>
                {sellerSubmitted && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-2.5 text-sm font-medium">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                    <span>Inquiry submitted! Our merchant onboarding team will reach out within 2-3 business days.</span>
                  </div>
                )}
                <form onSubmit={handleSellerSubmit} className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Business/Brand Owner Name</label>
                    <input
                      type="text"
                      required
                      value={sellerForm.name}
                      onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                      placeholder="e.g. Rahul Mehta"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#E95E82] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={sellerForm.email}
                      onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                      placeholder="e.g. merchant@brand.com"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#E95E82] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={sellerForm.phone}
                      onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                      placeholder="e.g. +91 99999 88888"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#E95E82] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Brand / Boutique Name</label>
                    <input
                      type="text"
                      required
                      value={sellerForm.brand}
                      onChange={(e) => setSellerForm({ ...sellerForm, brand: e.target.value })}
                      placeholder="e.g. Mehta Ethnic Creations"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#E95E82] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Short Message / Product Types</label>
                    <textarea
                      rows="3"
                      value={sellerForm.message}
                      onChange={(e) => setSellerForm({ ...sellerForm, message: e.target.value })}
                      placeholder="Describe your design styles and product catalog briefly..."
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#E95E82] transition-colors resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#E95E82] hover:bg-[#d8486d] text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Submit Seller Inquiry
                  </button>
                </form>
              </div>

              {/* Info Column */}
              <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <h4 className="font-bold text-gray-900 font-serif mb-2">Why Sell on Nari Pehnawa?</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Access to a massive community of ethnic wear buyers across India.</li>
                    <li>Very low, vendor-friendly commission structure.</li>
                    <li>Free pickup services and easy package shipping assistance.</li>
                    <li>Weekly payment settlements to your bank account directly.</li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-pink-50/50 border border-pink-100">
                  <h4 className="font-bold text-gray-900 font-serif mb-2">Artisan Support Program</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    If you are a direct village artisan or coordinate handloom boutique fabrics, we offer zero-commission onboarding support to encourage traditional weaving and prints.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-500 text-sm mb-6">The support topic you are looking for does not exist.</p>
            <Link to="/support/contact-us" className="px-5 py-2.5 bg-[#E95E82] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#d8486d] transition-colors">
              Go to Contact Us
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        
        {/* Banner */}
        <div className="bg-[#0D0C15] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden mb-10 shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#E95E82,transparent)] opacity-10" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-serif text-[#E95E82] mb-3 leading-tight">Help & Customer Support</h1>
          <p className="text-gray-400 text-xs md:text-sm max-w-lg mx-auto">We are here to ensure your Nari Pehnawa shopping experience is flawless. Browse guidelines or contact us directly.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-[260px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-[170px]">
              
              {/* Desktop links */}
              <div className="hidden lg:block space-y-1">
                {supportTopics.map((topic) => {
                  const Icon = topic.icon;
                  const isActive = activeTab === topic.slug;
                  return (
                    <button
                      key={topic.slug}
                      onClick={() => navigate(`/support/${topic.slug}`)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                        isActive
                          ? "bg-pink-50 text-[#E95E82] shadow-sm border-l-4 border-[#E95E82]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{topic.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile selector */}
              <div className="block lg:hidden">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Select Topic</label>
                <select
                  value={activeTab}
                  onChange={(e) => navigate(`/support/${e.target.value}`)}
                  className="w-full px-4 py-3 bg-white text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#E95E82] text-gray-800 font-medium"
                >
                  {supportTopics.map((topic) => (
                    <option key={topic.slug} value={topic.slug}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-10 min-h-[500px]">
              {renderContent()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
