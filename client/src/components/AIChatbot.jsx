import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Namaste! 🙏 I am Anya, your Nari Pehnawa AI Fashion Stylist. How can I help you choose the perfect outfit today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        { label: "👗 Suggest a Kurti Collection", key: "suggest_kurti" },
        { label: "🏡 Home Decor Inspiration", key: "suggest_decor" },
        { label: "🎁 Special Coupons & Offers", key: "offers" },
        { label: "🚚 Shipping & Return Policy", key: "shipping" }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const responses = {
    suggest_kurti: {
      text: "I highly recommend checking out our premium collections! Here are our best sellers:\n\n✨ **Elegant Anarkali**: Perfect for forever festive moments.\n🌸 **Chikankari Kurtis**: Authentic Lucknowi hand-crafted cotton sets.\n🔆 **Printed & Palazzo Sets**: Everyday comfort meets modern elegance.",
      suggestions: [
        { label: "Shop Anarkali", link: "/category/anarkali-kurtis" },
        { label: "Shop Chikankari", link: "/category/chikankari-kurtis" },
        { label: "Shop Palazzo Sets", link: "/category/palazzo-set-kurtis" }
      ]
    },
    suggest_decor: {
      text: "Beautify every corner of your home with our exclusive home styling products:\n\n🏺 **Vases & Planters**: Chic metallic and ceramic items.\n🖼️ **Wall Decor & Art**: Handcrafted accents to enrich your living room.\n🕯️ **Fragrances & Candles**: Create a warm, welcoming aroma.",
      suggestions: [
        { label: "Shop Vases & Planters", link: "/category/vases-planters" },
        { label: "Shop Wall Decor", link: "/category/wall-decor" },
        { label: "Shop Cushions", link: "/category/cushions-covers" }
      ]
    },
    offers: {
      text: "Enjoy these active discount codes at checkout:\n\n🔥 **WELCOME200**: Get ₹200 OFF on your first purchase above ₹1499.\n✨ **NARI10**: Get 10% OFF on all order values above ₹999.\n\nType **SALE** to check clearance items!",
      suggestions: [
        { label: "Shop Sale Items", link: "/category/sale" }
      ]
    },
    shipping: {
      text: "📦 **Shipping Info**:\n- FREE Shipping on orders above ₹1499. Below that, a flat ₹99 fee applies.\n- Delivery takes 3-5 business days across India.\n\n🔄 **Return Policy**:\n- We offer a hassle-free 7-day exchange and return policy on unwashed items.",
      suggestions: [
        { label: "Continue Shopping", key: "welcome_back" }
      ]
    },
    anarkali: {
      text: "Our Anarkalis are custom-crafted with soft premium fabrics. Try the **Elegant Floral Anarkali** or **Designer Anarkali Suit**!",
      suggestions: [{ label: "Shop Anarkalis", link: "/category/anarkali-kurtis" }]
    },
    chikankari: {
      text: "Chikankari is pure Lucknowi heritage. Extremely light, breathable, and perfect for hot days or festive meetups.",
      suggestions: [{ label: "Shop Chikankari", link: "/category/chikankari-kurtis" }]
    },
    welcome_back: {
      text: "How else can I style you today? Choose an option or ask me anything!",
      suggestions: [
        { label: "👗 Suggest a Kurti", key: "suggest_kurti" },
        { label: "🎁 Coupons", key: "offers" }
      ]
    }
  };

  const getAnyaReply = (userInput) => {
    const input = userInput.toLowerCase().trim();
    if (input.includes("anarkali") || input.includes("suit")) return responses.anarkali;
    if (input.includes("chikankari") || input.includes("chikan")) return responses.chikankari;
    if (input.includes("decor") || input.includes("home") || input.includes("vase") || input.includes("art")) return responses.suggest_decor;
    if (input.includes("offer") || input.includes("coupon") || input.includes("discount") || input.includes("code") || input.includes("sale")) return responses.offers;
    if (input.includes("shipping") || input.includes("delivery") || input.includes("return") || input.includes("exchange")) return responses.shipping;
    if (input.includes("kurti") || input.includes("dress") || input.includes("wear") || input.includes("clothes")) return responses.suggest_kurti;
    
    // Default reply
    return {
      text: "I would love to help you find that! You can browse our diverse categories of ethnic wear and home decor directly, or tell me more about the colors and styles you like.",
      suggestions: [
        { label: "👗 Browse Kurtis", key: "suggest_kurti" },
        { label: "🏡 Browse Decor", key: "suggest_decor" }
      ]
    };
  };

  const triggerReply = (replyObj) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: replyObj.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: replyObj.suggestions || []
        }
      ]);
    }, 1200);
  };

  const handleSuggestionClick = (sug) => {
    // Add user's choice to message window
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: sug.label,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (sug.key) {
      const reply = responses[sug.key];
      if (reply) triggerReply(reply);
    } else if (sug.link) {
      // Suggestion has a link, redirect or link directly
      triggerReply({
        text: `Opening page for "${sug.label}". Happy shopping! 🛍️`,
        suggestions: [{ label: "Main Menu", key: "welcome_back" }]
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputValue("");

    // Generate reply
    const replyObj = getAnyaReply(userText);
    triggerReply(replyObj);
  };

  // If user is logged in, hide chatbot entirely (fully conditional rendering)
  if (user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── CHAT WINDOW ── */}
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#8B0000] to-[#b81d1d] px-4 py-3 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Anya
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </h3>
                <p className="text-[10px] text-white/80">AI Shopping Stylist</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white/80 hover:text-white" />
            </button>
          </div>

          {/* Messages body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                      msg.sender === "user"
                        ? "bg-[#8B0000] text-white"
                        : "bg-white border border-slate-200 text-[#8B0000]"
                    }`}
                  >
                    {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.sender === "user"
                          ? "bg-[#8B0000] text-white rounded-tr-none"
                          : "bg-white text-gray-800 border border-slate-100 rounded-tl-none whitespace-pre-line"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 block px-1">
                      {msg.time}
                    </span>
                  </div>
                </div>

                {/* Suggestions / links */}
                {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-9">
                    {msg.suggestions.map((sug, sIdx) =>
                      sug.link ? (
                        <Link
                          key={sIdx}
                          to={sug.link}
                          onClick={() => {
                            setIsOpen(false); // Close chatbot on page routing
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#8B0000] text-[#8B0000] rounded-full text-[11px] font-semibold transition hover:bg-[#fff5f5] shadow-xs flex items-center gap-1.5"
                        >
                          {sug.label} 🛍️
                        </Link>
                      ) : (
                        <button
                          key={sIdx}
                          onClick={() => handleSuggestionClick(sug)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#8B0000] text-gray-700 hover:text-[#8B0000] rounded-full text-[11px] font-medium transition hover:bg-[#fff5f5] shadow-xs"
                        >
                          {sug.label}
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
                <div className="w-7 h-7 rounded-full bg-white border border-slate-200 text-[#8B0000] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Footer */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Anya a question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#8B0000] transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 bg-[#8B0000] hover:bg-[#6B0000] text-white rounded-xl transition disabled:opacity-40 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ── FLOATING TRIGGER BUBBLE ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-[#8B0000] to-[#b81d1d] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group relative"
      >
        <span className="absolute inset-0 rounded-full bg-[#8B0000]/30 animate-ping opacity-60 pointer-events-none group-hover:hidden" />
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-transform duration-300" />
        )}

        {/* Small badge stylist tooltip */}
        {!isOpen && (
          <span className="absolute -top-10 right-0 bg-white text-gray-800 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-slate-100 whitespace-nowrap pointer-events-none flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#d4af37]" />
            Ask Anya!
          </span>
        )}
      </button>
    </div>
  );
};

export default AIChatbot;
