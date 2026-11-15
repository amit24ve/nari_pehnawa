import React from "react";
import { Truck, ShieldCheck, RefreshCw, Award } from "lucide-react";

const TRUST_FEATURES = [
  {
    id: "free_shipping",
    title: "Free Shipping",
    subtitle: "on orders above ₹799",
    icon: Truck,
    highlight: true,
  },
  {
    id: "secure_payment",
    title: "Secure Payment",
    subtitle: "100% safe & secure",
    icon: ShieldCheck,
    highlight: false,
  },
  {
    id: "easy_exchange",
    title: "Easy Exchange",
    subtitle: "Hassle-free return",
    icon: RefreshCw,
    highlight: false,
  },
  {
    id: "quality_assured",
    title: "Quality Assured",
    subtitle: "Premium & trusted fabrics",
    icon: Award,
    highlight: false,
  },
];

const TrustFeaturesStrip = () => {
  return (
    <section className="relative w-full bg-white border-y border-stone-200/80 py-4 sm:py-5 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-center justify-items-center">
          {TRUST_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 sm:gap-3.5 w-full max-w-[260px] group transition-transform duration-200 hover:-translate-y-0.5"
              >
                {/* Circular Icon Container matching exact reference */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    item.highlight
                      ? "bg-[#c29ba1]/35 text-[#780016] border border-[#780016]/20 shadow-xs group-hover:bg-[#c29ba1]/50"
                      : "bg-[#fcfaf9] text-[#780016] border border-[#780016]/25 shadow-xs group-hover:border-[#780016] group-hover:bg-[#f7ecee]"
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5 stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
                </div>

                {/* Text Block */}
                <div className="flex flex-col text-left">
                  <span className="font-bold text-stone-900 text-xs sm:text-[13px] md:text-sm tracking-tight leading-tight group-hover:text-[#780016] transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[11px] sm:text-xs text-stone-500 font-normal leading-tight mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustFeaturesStrip;
