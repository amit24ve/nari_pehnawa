import React from "react";
import { Link } from "react-router-dom";

const BogoSpecialOfferBanner = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 my-3 sm:my-5">
      <Link
        to="/category/sale"
        className="group block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-rose-200/50 hover:border-rose-300 cursor-pointer bg-[#FDF0F1]"
        title="Special Offer: Buy 1 Get 1 Free - Mix your favourite styles"
      >
        <img
          src="/bogo_special_offer_banner.png"
          alt="Special Offer - Buy 1 Get 1 Free - Mix your favourite styles"
          className="w-full h-auto object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 ease-out"
          loading="eager"
        />
      </Link>
    </section>
  );
};

export default BogoSpecialOfferBanner;
