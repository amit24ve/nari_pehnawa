import React from "react";
import { Sparkles, TrendingUp, Award } from "lucide-react";

const PromoBanner = () => {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Premium Quality",
      description: "Handpicked fabrics and exquisite craftsmanship",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Latest Trends",
      description: "Stay ahead with our fashion-forward designs",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Best Prices",
      description: "Unbeatable deals on authentic ethnic wear",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-[#8B0000] via-[#a52a2a] to-[#8B0000] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Banner Content */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Why Choose BS Outfit?
          </h2>
          <p className="text-pink-100 text-lg max-w-2xl mx-auto">
            Experience the perfect blend of tradition and contemporary fashion
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 border border-white/20"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-pink-100">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button className="bg-white text-[#8B0000] px-10 py-4 rounded-full font-bold text-lg hover:bg-[#fff5f5] transform hover:scale-105 transition-all duration-300 shadow-2xl">
            Explore Collection
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
