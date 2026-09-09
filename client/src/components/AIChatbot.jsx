import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  ShoppingBag,
  Tag,
  Truck,
  RotateCcw,
  Headphones,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  ArrowRight,
  HeartHandshake
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const AIChatbot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initial welcome message
  const getInitialMessage = () => ({
    id: "welcome",
    sender: "bot",
    text: `Namaste! 🙏 How may I help you today? I am your Nari Pehnawa AI Fashion & Decor Assistant.\n\nExplore our latest festive collections, live discount codes, track your orders, or ask for any style advice!`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    suggestions: [
      { label: "👗 Browse Live Categories", key: "show_categories", icon: "👗" },
      { label: "🔥 Today's Mega Sale Offers", key: "offers", icon: "🔥" },
      { label: "✨ Best Seller Kurtis", key: "best_sellers", icon: "✨" },
      { label: "📦 Track My Order", key: "track_order", icon: "📦" },
      { label: "👑 Meet Founders (Pooja & Ritika)", key: "meet_founders", icon: "👑" },
      { label: "📞 Help & Support", key: "help_support", icon: "📞" }
    ]
  });

  const [messages, setMessages] = useState([getInitialMessage()]);

  // Fetch real categories and products dynamically from backend
  useEffect(() => {
    // 1. Fetch Categories
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out special categories like Sale or New Arrivals if duplicate
          const valid = data.filter((c) => c.display_order !== 0 && c.display_order !== 99);
          setCategories(valid.length > 0 ? valid : data);
        }
      })
      .catch((err) => console.warn("Could not load categories for chatbot:", err));

    // 2. Fetch Featured / Popular Products
    fetch(`${API_BASE_URL}/products/?limit=16`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeaturedProducts(data);
        }
      })
      .catch((err) => console.warn("Could not load products for chatbot:", err));
  }, []);

  // Update greeting when user logs in/out
  useEffect(() => {
    if (user && user.name) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome") {
          return [
            {
              id: "welcome",
              sender: "bot",
              text: `Namaste, ${user.name.split(" ")[0]}! 🙏 How may I help you today?\n\nI am your Nari Pehnawa AI Stylist. You can explore our handcrafted ethnic wear, live discounts, or track your orders anytime.`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              suggestions: prev[0].suggestions
            }
          ];
        }
        return prev;
      });
    }
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  // Dynamic path builder
  const buildCategoryPath = (cat) =>
    cat.link ||
    `/category/${cat.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  // Smart AI Reply Generator
  const generateDynamicReply = async (userInput) => {
    const input = userInput.toLowerCase().trim();

    // 1. Check if user asked for categories
    if (input.includes("category") || input.includes("categories") || input.includes("collection") || input.includes("types")) {
      const catList = categories.slice(0, 8);
      return {
        text: `We have a wide variety of authentic handcrafted collections! Here are our active categories:`,
        suggestions: catList.map((c) => ({
          label: c.name,
          link: buildCategoryPath(c)
        })).concat([{ label: "🔥 All Sale Items", link: "/category/sale" }])
      };
    }

    // 2. Check for Offers / Coupons / Sale
    if (input.includes("offer") || input.includes("coupon") || input.includes("discount") || input.includes("sale") || input.includes("promo") || input.includes("code")) {
      return {
        text: `🎉 **Current Live Offers & Coupons:**\n\n• **WELCOME200**: Flat ₹200 OFF on your first purchase above ₹1,499.\n• **NARI10**: Instant 10% OFF on all order values above ₹999.\n• **FREE SHIPPING**: Automatically applied on orders above ₹999!\n\nCheck out our clearance & festival mega sale for up to 70% discounts.`,
        suggestions: [
          { label: "🔥 Shop Mega Sale", link: "/category/sale" },
          { label: "✨ New Arrivals", link: "/new-arrivals" },
          { label: "👗 View All Categories", key: "show_categories" }
        ]
      };
    }

    // 3. Check for Track Order / Shipping / Delivery
    if (input.includes("track") || input.includes("order") || input.includes("shipping") || input.includes("delivery") || input.includes("status") || input.includes("awb")) {
      return {
        text: `📦 **Order Tracking & Shipping:**\n\n• Orders are dispatched within 24-48 hours via premium express couriers.\n• Standard delivery time is 3-5 business days across India.\n• COD and online payments are fully supported.\n\nYou can track your shipment anytime with your Order ID or AWB number!`,
        suggestions: [
          { label: "🚚 Track My Shipment", link: "/user/orders" },
          { label: "💬 Contact Support", link: "/support/contact-us" }
        ]
      };
    }

    // 4. Check for Return / Exchange Policy
    if (input.includes("return") || input.includes("exchange") || input.includes("refund")) {
      return {
        text: `🔄 **7-Day Hassle-Free Exchange Policy:**\n\n• We offer easy 7-day exchanges on unused, unwashed garments with tags intact.\n• For doorstep pickup or size replacement, contact our customer support team.\n• 100% genuine craftsmanship guarantee.`,
        suggestions: [
          { label: "📜 Return & Refund Policy", link: "/support/refund-policy" },
          { label: "📞 Contact Support", link: "/support/contact-us" }
        ]
      };
    }

    // 5. Check for Founders / Owner Info
    if (input.includes("owner") || input.includes("founder") || input.includes("malik") || input.includes("pooja") || input.includes("ritika") || input.includes("about") || input.includes("who is")) {
      return {
        text: `👑 **Nari Pehnawa Founders:**\n\nNari Pehnawa was founded with love by **Pooja Verma & Ritika Singh**, dedicated to bringing direct weaver handcrafted ethnic wear from Uttar Pradesh (Prayagraj & Deoria) to women across India!`,
        suggestions: [
          { label: "✨ Meet The Founders", link: "/owner" },
          { label: "🛍️ Shop Collection", link: "/new-arrivals" }
        ]
      };
    }

    // 6. Check for Help / Support / Contact
    if (input.includes("help") || input.includes("support") || input.includes("call") || input.includes("phone") || input.includes("contact") || input.includes("whatsapp")) {
      return {
        text: `📞 **Customer Support:**\n\nOur team is available Monday to Saturday (10:00 AM - 7:00 PM IST).\n\n• **Email**: support@naripehnawa.com\n• **Direct Helpline**: Available via Contact Us page.\n• **Location**: Prayagraj & Deoria, Uttar Pradesh.`,
        suggestions: [
          { label: "📩 Contact Us Page", link: "/support/contact-us" },
          { label: "❓ FAQs", link: "/support/faqs" }
        ]
      };
    }

    // 7. Dynamic matching with Categories in Database
    const matchedCategory = categories.find((c) =>
      input.includes(c.name.toLowerCase()) ||
      (c.link && input.includes(c.link.toLowerCase().replace("/category/", "")))
    );

    if (matchedCategory) {
      // Find products in this category
      const matchedProducts = featuredProducts.filter(
        (p) => p.category && p.category.toLowerCase().includes(matchedCategory.name.toLowerCase())
      ).slice(0, 3);

      return {
        text: `✨ We have lovely designs in **${matchedCategory.name}**! Here are recommended styles:`,
        products: matchedProducts,
        suggestions: [
          { label: `👗 View All ${matchedCategory.name}`, link: buildCategoryPath(matchedCategory) },
          { label: "🔥 Check Offers", key: "offers" }
        ]
      };
    }

    // 8. Live API Search for products matching the user's text
    try {
      const searchRes = await fetch(`${API_BASE_URL}/products/?search=${encodeURIComponent(input)}&limit=3`);
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          return {
            text: `I found ${results.length} matching products for "${userInput}":`,
            products: results,
            suggestions: [
              { label: "🛍️ View New Arrivals", link: "/new-arrivals" },
              { label: "👗 Browse All Categories", key: "show_categories" }
            ]
          };
        }
      }
    } catch (e) {
      console.warn("Chatbot search error:", e);
    }

    // 9. Default Fallback with live categories
    return {
      text: `I'd love to help you find the best outfit or home decor! You can explore our live collections below, search for any product name, or ask me about discounts and delivery.`,
      suggestions: [
        { label: "👗 View Categories", key: "show_categories" },
        { label: "✨ New Arrivals", link: "/new-arrivals" },
        { label: "🔥 Mega Sale", link: "/category/sale" },
        { label: "📦 Track Order", link: "/user/orders" }
      ]
    };
  };

  const triggerBotReply = (replyObj) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "bot",
          text: replyObj.text,
          products: replyObj.products || [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestions: replyObj.suggestions || []
        }
      ]);
    }, 600);
  };

  const handleSuggestionClick = async (sug) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text: sug.label,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);

    if (sug.link) {
      // Direct navigation
      triggerBotReply({
        text: `Opening "${sug.label}" for you! Happy shopping! 🛍️`,
        suggestions: [
          { label: "👗 Main Menu", key: "welcome_back" },
          { label: "🔥 Mega Sale", link: "/category/sale" }
        ]
      });
      setTimeout(() => {
        setIsOpen(false);
        navigate(sug.link);
      }, 500);
      return;
    }

    if (sug.key === "show_categories") {
      const catSuggestions = categories.slice(0, 8).map((c) => ({
        label: c.name,
        link: buildCategoryPath(c)
      })).concat([{ label: "🔥 All Sale Items", link: "/category/sale" }]);

      triggerBotReply({
        text: `Here are our trending categories available right now:`,
        suggestions: catSuggestions
      });
      return;
    }

    if (sug.key === "best_sellers") {
      const bests = featuredProducts.slice(0, 3);
      triggerBotReply({
        text: `Here are some of our customer-favourite bestsellers:`,
        products: bests,
        suggestions: [
          { label: "✨ Explore New Arrivals", link: "/new-arrivals" },
          { label: "🔥 Shop Sale", link: "/category/sale" }
        ]
      });
      return;
    }

    if (sug.key === "welcome_back") {
      triggerBotReply({
        text: `How else may I help you? Choose an option below or type your question!`,
        suggestions: [
          { label: "👗 Browse Categories", key: "show_categories" },
          { label: "🔥 Today's Offers", key: "offers" },
          { label: "📦 Track Order", key: "track_order" }
        ]
      });
      return;
    }

    // Generic key handling
    const reply = await generateDynamicReply(sug.key || sug.label);
    triggerBotReply(reply);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setInputValue("");

    setIsTyping(true);
    const replyObj = await generateDynamicReply(userText);
    setIsTyping(false);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "bot",
        text: replyObj.text,
        products: replyObj.products || [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestions: replyObj.suggestions || []
      }
    ]);
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* ══════════════════════════════════════
          CHAT WINDOW MODAL (Responsive Mobile + Desktop)
      ══════════════════════════════════════ */}
      {isOpen && (
        <div 
          ref={chatContainerRef}
          className="w-[calc(100vw-32px)] sm:w-[390px] h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden mb-3.5 transition-all duration-300 animate-fadeIn"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#580C1F] via-[#8B0000] to-[#580C1F] px-4 py-3.5 flex items-center justify-between text-white shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-[#580C1F] font-bold shadow-md border-2 border-white/40">
                  <Sparkles className="w-5 h-5 text-[#580C1F]" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm leading-tight flex items-center gap-1.5 text-white">
                  Nari Pehnawa Assistant
                </h3>
                <p className="text-[10px] text-amber-200/90 font-medium">
                  How may I help you? • Online
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white cursor-pointer"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Info Bar */}
          <div className="bg-amber-50/80 px-4 py-1.5 border-b border-amber-200/60 flex items-center justify-between text-[10px] text-amber-900 font-semibold flex-shrink-0">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#8B0000]" />
              <span>Flat 10% OFF with code: <strong>NARI10</strong></span>
            </span>
            <Link
              to="/category/sale"
              onClick={() => setIsOpen(false)}
              className="text-[#8B0000] underline font-bold hover:text-red-700"
            >
              Sale →
            </Link>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-stone-50/60 to-white scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`flex gap-2 max-w-[88%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
                      msg.sender === "user"
                        ? "bg-[#8B0000] text-white"
                        : "bg-[#FAF5ED] border border-amber-200 text-[#8B0000]"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        msg.sender === "user"
                          ? "bg-[#8B0000] text-white rounded-tr-none font-medium"
                          : "bg-white text-stone-800 border border-stone-200/80 rounded-tl-none whitespace-pre-line"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Product Recommendation Cards (if any) */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {msg.products.map((prod) => (
                          <div
                            key={prod._id || prod.id}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/product/${prod._id || prod.id}`);
                            }}
                            className="flex items-center gap-2.5 p-2 bg-white border border-stone-200 hover:border-[#8B0000] rounded-xl transition-all hover:shadow-md cursor-pointer group"
                          >
                            <img
                              src={prod.image || "/placeholder.jpg"}
                              alt={prod.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-stone-100"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-stone-900 truncate group-hover:text-[#8B0000] transition-colors">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-[#8B0000]">
                                  ₹{prod.price?.toLocaleString("en-IN")}
                                </span>
                                {prod.original_price && prod.original_price > prod.price && (
                                  <span className="text-[10px] text-stone-400 line-through">
                                    ₹{prod.original_price?.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-[#8B0000] bg-red-50 px-2 py-1 rounded-md flex-shrink-0 group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
                              View →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className="text-[9px] text-stone-400 mt-1 block px-1">
                      {msg.time}
                    </span>
                  </div>
                </div>

                {/* Suggestions / Interactive Action Chips */}
                {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-9 pt-0.5">
                    {msg.suggestions.map((sug, sIdx) =>
                      sug.link ? (
                        <Link
                          key={sIdx}
                          to={sug.link}
                          onClick={() => setIsOpen(false)}
                          className="px-2.5 py-1 bg-white border border-stone-200 hover:border-[#8B0000] text-[#8B0000] hover:bg-[#FAF5ED] rounded-full text-[10.5px] font-semibold transition-all shadow-xs flex items-center gap-1 group cursor-pointer"
                        >
                          <span>{sug.label}</span>
                          <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-[#8B0000] transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <button
                          key={sIdx}
                          onClick={() => handleSuggestionClick(sug)}
                          className="px-2.5 py-1 bg-white border border-stone-200 hover:border-[#8B0000] text-stone-700 hover:text-[#8B0000] hover:bg-[#FAF5ED] rounded-full text-[10.5px] font-medium transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          {sug.icon && <span>{sug.icon}</span>}
                          <span>{sug.label}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 max-w-[80%] mr-auto items-center">
                <div className="w-7 h-7 rounded-full bg-[#FAF5ED] border border-amber-200 text-[#8B0000] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-stone-200/80 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <form
            onSubmit={handleSend}
            className="p-2.5 sm:p-3 border-t border-stone-200 bg-white flex gap-2 items-center flex-shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything or search styles..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8B0000] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-xl transition-all disabled:opacity-40 shadow-sm cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════
          FLOATING TRIGGER BUBBLE (HOW MAY I HELP YOU?)
      ══════════════════════════════════════ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[#580C1F] via-[#8B0000] to-[#580C1F] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group relative border-2 border-amber-300/40 cursor-pointer"
        aria-label="Toggle AI Assistant"
      >
        <span className="absolute inset-0 rounded-full bg-[#8B0000]/30 animate-ping opacity-60 pointer-events-none group-hover:hidden" />
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-transform duration-300" />
        )}

        {/* High Converting Stylist Badge Tooltip */}
        {!isOpen && (
          <span className="absolute -top-9 sm:-top-10 right-0 bg-white text-stone-900 text-[10.5px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-xl border border-stone-200 whitespace-nowrap pointer-events-none flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>How may I help you?</span>
          </span>
        )}
      </button>
    </div>
  );
};

export default AIChatbot;
