import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  ChevronRight,
  Flame,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

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

  // Standard shopping suggestions
  const defaultSuggestions = [
    { label: "👗 Browse Live Categories", key: "show_categories" },
    { label: "🔥 Today's Mega Sale Offers", link: "/category/sale" },
    { label: "✨ Best Sellers", key: "best_sellers" },
    { label: "📦 Track My Order", link: "/user/orders" },
    { label: "💬 Help & Support", link: "/support/contact-us" }
  ];

  // Initial welcome message
  const getInitialMessage = () => ({
    id: "welcome",
    sender: "bot",
    text: `Hello! How may I help you?\n\nI am your Nari Pehnawa AI Assistant. You can explore our handcrafted collections, track your orders, check live offers, or ask for any style advice!`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    suggestions: defaultSuggestions
  });

  const [messages, setMessages] = useState([getInitialMessage()]);

  // Fetch real categories and products dynamically from backend
  useEffect(() => {
    // 1. Fetch Categories
    fetch(`${API_BASE_URL}/categories/?is_active=true`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
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

  // Update greeting when user logs in
  useEffect(() => {
    if (user && user.name) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome") {
          return [
            {
              id: "welcome",
              sender: "bot",
              text: `Hello! How may I help you?\n\nI am your Nari Pehnawa AI Assistant. You can explore our handcrafted ethnic wear, live discounts, or track your orders anytime.`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              suggestions: defaultSuggestions
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

    // 1. Categories Query
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

    // 2. Offers / Coupons / Sale
    if (input.includes("offer") || input.includes("coupon") || input.includes("discount") || input.includes("sale") || input.includes("promo") || input.includes("code")) {
      return {
        text: `🎉 **Current Live Offers & Coupons:**\n\n• **WELCOME200**: Flat ₹200 OFF on your first purchase above ₹1,499.\n• **NARI10**: Instant 10% OFF on all orders above ₹999.\n• **FREE DELIVERY**: Free shipping automatically applied on your order!\n\nExplore our live Flash Sale for limited-time discounts.`,
        suggestions: [
          { label: "🔥 Today's Mega Sale Offers", link: "/category/sale" },
          { label: "✨ Best Sellers", key: "best_sellers" },
          { label: "👗 Browse Categories", key: "show_categories" }
        ]
      };
    }

    // 3. Track Order / Shipping / Delivery
    if (input.includes("track") || input.includes("order") || input.includes("shipping") || input.includes("delivery") || input.includes("status") || input.includes("awb")) {
      return {
        text: `📦 **Order Tracking & Shipping:**\n\n• Orders are dispatched within 24-48 hours via express courier partners.\n• Standard delivery time is 3-5 business days across India.\n• Both Cash on Delivery (COD) and Online Payments are supported.\n\nYou can track your order status live in your account!`,
        suggestions: [
          { label: "📦 Track My Order", link: "/user/orders" },
          { label: "💬 Help & Support", link: "/support/contact-us" }
        ]
      };
    }

    // 4. Return / Exchange Policy
    if (input.includes("return") || input.includes("exchange") || input.includes("refund")) {
      return {
        text: `🔄 **7-Day Easy Exchange Policy:**\n\n• We offer easy 7-day exchanges on unused, unwashed garments with original tags intact.\n• Need a different size or doorstep pickup? You can request it directly from your Orders page.\n• 100% authentic artisan quality guaranteed.`,
        suggestions: [
          { label: "📜 Return & Refund Policy", link: "/support/refund-policy" },
          { label: "💬 Help & Support", link: "/support/contact-us" }
        ]
      };
    }

    // 5. Founders / Owner Info (Only triggered if user explicitly asks)
    if (input.includes("owner") || input.includes("founder") || input.includes("malik") || input.includes("pooja") || input.includes("ritika") || input.includes("about") || input.includes("who is")) {
      return {
        text: `👑 **Nari Pehnawa Founders:**\n\nNari Pehnawa was founded with love by **Pooja Verma & Ritika Singh**, dedicated to bringing direct weaver handcrafted ethnic wear from Uttar Pradesh (Prayagraj & Deoria) to women across India!`,
        suggestions: [
          { label: "✨ Read Our Story", link: "/owner" },
          { label: "👗 Browse Live Categories", key: "show_categories" }
        ]
      };
    }

    // 6. Help / Support / Contact
    if (input.includes("help") || input.includes("support") || input.includes("call") || input.includes("phone") || input.includes("contact") || input.includes("whatsapp")) {
      return {
        text: `💬 **Customer Support:**\n\nOur support team is available Monday to Saturday (10:00 AM - 7:00 PM IST).\n\n• **Email**: support@naripehnawa.com\n• **Direct Helpline**: Available on Contact Us page.\n• **Location**: Prayagraj & Deoria, Uttar Pradesh.`,
        suggestions: [
          { label: "💬 Help & Support", link: "/support/contact-us" },
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
      const matchedProducts = featuredProducts.filter(
        (p) => p.category && p.category.toLowerCase().includes(matchedCategory.name.toLowerCase())
      ).slice(0, 3);

      return {
        text: `✨ Here are recommended styles in **${matchedCategory.name}**:`,
        products: matchedProducts,
        suggestions: [
          { label: `👗 View All ${matchedCategory.name}`, link: buildCategoryPath(matchedCategory) },
          { label: "🔥 Today's Mega Sale Offers", link: "/category/sale" }
        ]
      };
    }

    // 8. Live API Search for products
    try {
      const searchRes = await fetch(`${API_BASE_URL}/products/?search=${encodeURIComponent(input)}&limit=3`);
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          return {
            text: `I found matching products for "${userInput}":`,
            products: results,
            suggestions: [
              { label: "👗 Browse Live Categories", key: "show_categories" },
              { label: "🔥 Today's Mega Sale Offers", link: "/category/sale" }
            ]
          };
        }
      }
    } catch (e) {
      console.warn("Chatbot search error:", e);
    }

    // 9. Default Fallback
    return {
      text: `I'd love to help you find the perfect outfit! You can explore our live collections below, check today's offers, or track your orders anytime.`,
      suggestions: defaultSuggestions
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
          suggestions: replyObj.suggestions || defaultSuggestions
        }
      ]);
    }, 500);
  };

  const handleSuggestionClick = async (sug) => {
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
      triggerBotReply({
        text: `Opening "${sug.label}" for you! Happy shopping! 🛍️`,
        suggestions: defaultSuggestions
      });
      setTimeout(() => {
        setIsOpen(false);
        navigate(sug.link);
      }, 400);
      return;
    }

    if (sug.key === "show_categories") {
      const catSuggestions = categories.slice(0, 8).map((c) => ({
        label: `👗 ${c.name}`,
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
          { label: "👗 Browse Live Categories", key: "show_categories" },
          { label: "🔥 Today's Mega Sale Offers", link: "/category/sale" }
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
        suggestions: replyObj.suggestions || defaultSuggestions
      }
    ]);
  };

  // Helper to render clean formatted message text without raw markdown
  const renderCleanMessage = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return (
      <div className="space-y-1">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1.5" />;
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <div key={lIdx} className={line.trim().startsWith("•") ? "pl-2 flex items-start gap-1.5" : ""}>
              <div className="flex-1">
                {parts.map((part, pIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={pIdx} className="font-bold text-[#8B0000]">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* ══════════════════════════════════════
          CHAT WINDOW MODAL (100% Responsive Mobile + Desktop)
      ══════════════════════════════════════ */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="fixed inset-x-3 bottom-3 sm:static sm:inset-auto w-auto sm:w-[380px] h-[510px] max-h-[82vh] sm:max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden mb-3 transition-all duration-300 animate-fadeIn z-50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8B0000] via-[#A01020] to-[#8B0000] px-4 py-3.5 flex items-center justify-between text-white shadow-md flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-amber-300 font-bold border border-white/25">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#8B0000]" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm leading-tight text-white">
                  Nari Pehnawa Assistant
                </h3>
                <p className="text-[11px] text-amber-200/90 font-medium">
                  Always here to help you • Online
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/15 rounded-full transition-colors text-white/90 hover:text-white cursor-pointer"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-[#fafaf9] scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div
                  className={`flex gap-2 max-w-[90%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${msg.sender === "user"
                        ? "bg-[#8B0000] text-white"
                        : "bg-white border border-stone-200 text-[#8B0000]"
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
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${msg.sender === "user"
                          ? "bg-[#8B0000] text-white rounded-tr-none font-medium"
                          : "bg-white text-stone-800 border border-stone-200 rounded-tl-none"
                        }`}
                    >
                      {renderCleanMessage(msg.text)}
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

                {/* Quick Action Suggestion Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-9 pt-1 animate-fadeIn">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(sug)}
                        className="text-[11px] font-medium bg-white hover:bg-stone-50 border border-stone-300 hover:border-[#8B0000] text-stone-700 hover:text-[#8B0000] px-3 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer text-left"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 mr-auto pl-1">
                <div className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#8B0000] shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-stone-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSend}
            className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about kurtis, offers, orders..."
              className="flex-1 bg-stone-50 border border-stone-200 focus:border-[#8B0000] rounded-full px-3.5 py-2 text-xs text-stone-800 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 rounded-full bg-[#8B0000] hover:bg-[#a01020] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex-shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════
          FLOATING CHATBOT TOGGLE BUTTON (Pure Message Icon)
      ══════════════════════════════════════ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[#8B0000] via-[#A01020] to-[#8B0000] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/40 select-none ${isOpen ? "ring-4 ring-red-400/30" : ""
          }`}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#8B0000]" />
          </div>
        )}
      </button>
    </div>
  );
};

export default AIChatbot;
