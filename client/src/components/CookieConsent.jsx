import React, { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";

const CookieConsent = ({ onConsentChange }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if Do Not Track (DNT) is set by the browser
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    const isDNT = dnt === "1" || dnt === "yes";

    const consent = localStorage.getItem("np_cookie_consent");

    if (isDNT) {
      // Respect Do Not Track silently by default
      if (!consent) {
        localStorage.setItem("np_cookie_consent", "declined");
        if (onConsentChange) onConsentChange("declined");
      }
      return;
    }

    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      if (onConsentChange) onConsentChange(consent);
    }
  }, [onConsentChange]);

  const handleAccept = () => {
    localStorage.setItem("np_cookie_consent", "accepted");
    setVisible(false);
    if (onConsentChange) onConsentChange("accepted");
  };

  const handleDecline = () => {
    localStorage.setItem("np_cookie_consent", "declined");
    setVisible(false);
    if (onConsentChange) onConsentChange("declined");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-[9999] animate-in slide-in-from-bottom duration-500 ease-out">
      <div className="bg-[#111827]/95 backdrop-blur-md border border-gray-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-left">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#c49f2f] text-white">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Privacy & Cookies</h3>
          </div>
          <button 
            onClick={handleDecline} 
            className="text-gray-500 hover:text-gray-400 p-1 rounded-full hover:bg-gray-800/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
          We use anonymous cookies and behavior tracking to optimize your shopping experience, suggest products, and improve our interface. Do you consent to our visitor intelligence analytics?
        </p>
        
        <div className="flex items-center gap-3 justify-end mt-2">
          <button
            onClick={handleDecline}
            className="text-xs px-4 py-2 text-gray-400 hover:text-white border border-gray-800 hover:bg-gray-800/50 rounded-xl transition duration-300 font-medium"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="text-xs px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#c49f2f] text-black font-semibold rounded-xl hover:opacity-95 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition duration-300"
          >
            Accept Tracking
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
