import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Heart,
  ShoppingBag,
  Layers,
  Scissors
} from "lucide-react";

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const oldTitle = document.title;
    document.title = "About Us | Our Story & Heritage — Nari Pehnawa";

    const metaTags = {
      description:
        "Learn about Nari Pehnawa — an authentic Indian ethnic fashion brand dedicated to handcrafted kurtis, co-ord sets, dresses, and breathable cotton handlooms with honest pricing.",
      keywords:
        "Nari Pehnawa, About Nari Pehnawa, Indian Ethnic Wear, Handloom Kurtis, Pure Cotton Ethnic Fashion, Women Fashion India",
      "og:title": "About Us | Our Story & Heritage — Nari Pehnawa",
      "og:description":
        "Discover the journey of Nari Pehnawa: authentic handloom fashion directly from artisan looms with honest pricing and lasting trust.",
      "og:url": "https://www.naripehnawa.com/about-us",
      "og:type": "website",
    };

    const elementsToCleanup = [];
    Object.entries(metaTags).forEach(([key, val]) => {
      let el;
      if (key.startsWith("og:")) {
        el = document.querySelector(`meta[property="${key}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("property", key);
          document.head.appendChild(el);
          elementsToCleanup.push(el);
        }
      } else {
        el = document.querySelector(`meta[name="${key}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("name", key);
          document.head.appendChild(el);
          elementsToCleanup.push(el);
        }
      }
      el.setAttribute("content", val);
    });

    return () => {
      document.title = oldTitle;
      elementsToCleanup.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, []);

  const collections = [
    {
      title: "Designer Kurtis",
      desc: "Anarkali, straight cut, and A-line silhouettes tailored in breathable pure cotton and rich Chanderi drapes.",
      image: "/product_1_sky_bloom.jpg",
      link: "/category/Kurtis"
    },
    {
      title: "Ethnic Dresses",
      desc: "Modern Indo-Western flare meets traditional hand-block printing for graceful festive celebrations.",
      image: "/category_anarkali.png",
      link: "/category/Dresses"
    },
    {
      title: "Bespoke Co-ord Sets",
      desc: "Tailored two-piece and three-piece ensembles pairing contemporary tops with comfortable straight trousers.",
      image: "/category_coord.png",
      link: "/category/Co-ords"
    },
    {
      title: "Handcrafted Tops",
      desc: "Peplum cuts, short tunics, and daily wear tops designed for all-day breathability and movement.",
      image: "/product_4_coral_pink.jpg",
      link: "/category/Tops"
    },
    {
      title: "New Seasonal Arrivals",
      desc: "Weekly limited-edition drops featuring seasonal palettes, delicate gota-patti, and natural vegetable dyes.",
      image: "/product_2_olive_bloom.jpg",
      link: "/new-arrivals"
    }
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-white text-gray-900 font-sans selection:bg-[#780016] selection:text-white">
      
      {/* ── TOP LUXURY BAR & NAVIGATION ── */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="font-serif text-lg sm:text-2xl font-bold tracking-[0.2em] text-[#780016] hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#C59B27] flex-shrink-0" />
            <span>NARI PEHNAWA</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-[#780016] transition-colors hidden sm:block"
            >
              Home
            </Link>
            <Link
              to="/new-arrivals"
              className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-[#780016] transition-colors hidden sm:block"
            >
              New Arrivals
            </Link>
            <Link
              to="/owner"
              className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-[#780016] transition-colors hidden sm:block"
            >
              Meet The Founder
            </Link>
            <Link
              to="/new-arrivals"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-[#780016] hover:bg-[#5A0010] text-white transition-all shadow-xs"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMB ── */}
      <nav aria-label="Breadcrumb" className="bg-[#FAF7F2] border-b border-[#E8DFC8]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#780016] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-[#780016] font-semibold">About Us</span>
        </div>
      </nav>

      <main className="flex-grow w-full overflow-x-hidden">

        {/* ── 1. PREMIUM HERO SECTION ── */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-[#1F0206] via-[#2A0309] to-[#150104] text-white text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C59B27] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-4">
            <span className="text-amber-200 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] inline-block">
              Authentic Indian Ethnic Label
            </span>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              The Art of <span className="text-[#E5B842] italic font-serif">Indian Elegance</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-amber-100/85 font-light max-w-xl mx-auto leading-relaxed">
              Weaving handloom heritage, breathable cotton purity, and modern silhouette grace into every Indian woman's wardrobe.
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C59B27]" />
              <Crown className="w-4 h-4 text-[#C59B27]" />
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C59B27]" />
            </div>
          </div>
        </section>

        {/* ── 2. OUR STORY ── */}
        <section className="py-14 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:grid md:grid-cols-12 md:gap-12 items-center">
            
            {/* Story Image */}
            <div className="w-full md:col-span-5 mb-8 md:mb-0">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-stone-100 border border-stone-200 shadow-lg">
                <img
                  src="/nari_storefront.jpg"
                  onError={(e) => {
                    e.currentTarget.src = "/fashion-banner-bg.png";
                  }}
                  alt="Nari Pehnawa Storefront & Boutique"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5B842] block">
                    Rooted In Tradition
                  </span>
                  <p className="font-serif text-sm font-semibold">
                    From Uttar Pradesh Artisan Looms to India's Modern Wardrobes
                  </p>
                </div>
              </div>
            </div>

            {/* Story Text */}
            <div className="w-full md:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">
                Our Roots &amp; Heritage
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Crafted For Women, By Women
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                <p>
                  <strong className="text-gray-900 font-semibold">Nari Pehnawa</strong> was established with a singular, resolute intention: to celebrate the timeless dignity of authentic Indian ethnic wear while making genuine handloom craftsmanship accessible, comfortable, and affordable for every woman across the nation.
                </p>
                <p>
                  Rooted in Purvanchal's rich weaving belt in Uttar Pradesh, our journey began by addressing a long-standing challenge in the fashion industry. Mainstream retail boutiques charged exorbitant markups for ethnic garments, while mass commercial outlets frequently compromised on pure cotton breathability, dye fastness, and realistic silhouette fits.
                </p>
                <p>
                  By traveling directly to generational master weavers across Uttar Pradesh, Nari Pehnawa eliminated distributor layers. Every fabric lot is curated for thread count density, natural dye longevity, and skin-kind softness, resulting in heirloom-grade kurtis, dresses, and co-ord sets that feel featherlight all day long.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/owner"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#780016] hover:text-[#5A0010] transition-colors"
                >
                  <span>Read Founder Pooja Verma's Personal Journey</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── 3. OUR MISSION & VISION ── */}
        <section className="py-14 sm:py-20 bg-[#FAF7F2] border-y border-[#E8DFC8]/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-1.5 mb-10 sm:mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">
                Guiding Principles
              </span>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900">
                Our Mission &amp; Vision
              </h3>
              <div className="w-12 h-0.5 bg-[#C59B27] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Mission */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8DFC8] space-y-3 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#780016] block">
                  Our Mission
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                  Democratizing Authentic Ethnic Luxury
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                  To deliver pure, breathable, and regal Indian ethnic fashion straight from traditional artisan looms to every Indian household — built upon complete fabric transparency, generous fitting margins, and honest loom-to-wardrobe pricing.
                </p>
              </div>

              {/* Vision */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8DFC8] space-y-3 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#780016] block">
                  Our Vision
                </span>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                  Empowering Artisans &amp; Women Everywhere
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                  To become India's most trusted woman-led ethnic fashion brand, fostering generational weaver preservation, uplifting female tailors and craftswomen, and celebrating effortless grace across daily, office, and celebratory occasions.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── 4. OUR FASHION PHILOSOPHY ── */}
        <section className="py-14 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-1.5 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">
              Design Values
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900">
              Our Fashion Philosophy
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
              Fashion that honors heritage, fits real Indian bodies, and endures beyond fleeting seasonal fads.
            </p>
            <div className="w-12 h-0.5 bg-[#C59B27] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">01.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">100% Breathable Fabrics</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Pure cottons, soft malmal, and skin-kind natural dyes chosen specifically to stay featherlight throughout long tropical days.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">02.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">True Indian Fit Margins</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Generous 2 to 3-inch inner margins and tailored armhole curves calibrated for real Indian body contours and effortless ease.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">03.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">Timeless Grace</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Silhouettes that transition seamlessly from professional boardrooms and festive family rituals to relaxed casual weekends.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">04.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">Direct-From-Loom Value</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Bypassing corporate middlemen ensures fair wages for weavers while delivering accessible luxury pricing to our customers.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. WHY CHOOSE NARI PEHNAWA? ── */}
        <section className="py-14 sm:py-20 bg-[#1F0206] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-1.5 mb-10 sm:mb-14">
              <span className="text-[#E5B842] text-xs font-bold uppercase tracking-[0.2em]">
                The Brand Advantage
              </span>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white">
                Why Discerning Women Choose Nari Pehnawa
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/80 max-w-lg mx-auto font-light">
                Every outfit carries our personal seal of craftsmanship, durability, and customer care.
              </p>
              <div className="w-12 h-0.5 bg-[#C59B27] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="space-y-2 border-t border-[#C59B27]/40 pt-4">
                <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider block">
                  Quality Products
                </span>
                <h4 className="font-serif text-base font-bold text-white">Rigorous Artisan Inspection</h4>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  Every batch is hand-tested for yarn strength, dye fastness, and reinforced lock-stitch durability before tailoring.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#C59B27]/40 pt-4">
                <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider block">
                  Trendy Designs
                </span>
                <h4 className="font-serif text-base font-bold text-white">Contemporary Ethnic Fusion</h4>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  Harmonizing timeless heritage block prints with modern necklines, flared hems, and chic co-ord trouser cuts.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#C59B27]/40 pt-4">
                <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider block">
                  Affordable Fashion
                </span>
                <h4 className="font-serif text-base font-bold text-white">Honest Transparent Pricing</h4>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  Zero showroom markups. Customers pay solely for authentic fabric quality, skilled craftsmanship, and lasting finish.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#C59B27]/40 pt-4">
                <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider block">
                  Bespoke Customization
                </span>
                <h4 className="font-serif text-base font-bold text-white">Custom Tailoring Available</h4>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  Order any design tailored specifically to your unique bust, sleeve, and length measurements with our custom outfit option.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#C59B27]/40 pt-4">
                <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider block">
                  Customer Satisfaction
                </span>
                <h4 className="font-serif text-base font-bold text-white">Dedicated Support Team</h4>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  Prompt sizing assistance, order tracking updates, and hassle-free returns designed around your complete peace of mind.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#C59B27]/40 pt-4">
                <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider block">
                  Reliable Shopping
                </span>
                <h4 className="font-serif text-base font-bold text-white">Pan-India Direct Dispatch</h4>
                <p className="text-xs text-stone-300 font-light leading-relaxed">
                  Secure encrypted checkout, cash on delivery (COD) availability, and door-to-door delivery across all Indian pin codes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. OUR COLLECTIONS ── */}
        <section className="py-14 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-1.5 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">
              Curated Wardrobe
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-gray-900">
              Explore Our Signature Collections
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
              From everyday office essentials to regal festive attire, discover handloom perfection.
            </p>
            <div className="w-12 h-0.5 bg-[#C59B27] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((item, idx) => (
              <div
                key={idx}
                className="group rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-xs flex flex-col transition-all hover:border-[#780016]/40 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-serif text-base font-bold text-gray-900 group-hover:text-[#780016] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#780016] uppercase tracking-wider group-hover:underline"
                  >
                    <span>View Collection</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. CUSTOMER TRUST SECTION ── */}
        <section className="py-12 sm:py-16 bg-[#FAF7F2] border-y border-[#E8DFC8]/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-1.5 mb-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">
                Peace of Mind
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
                The Nari Pehnawa Trust Promise
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-[#780016] flex items-center justify-center mx-auto">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-bold text-gray-900">Pan-India Shipping</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Reliable courier delivery with end-to-end SMS &amp; WhatsApp tracking to all Indian pin codes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-[#780016] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-bold text-gray-900">100% Secure Payments</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Encrypted payments via UPI, Google Pay, Credit/Debit cards, Net Banking, and COD.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-[#780016] flex items-center justify-center mx-auto">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-bold text-gray-900">Easy 15-Day Returns</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Hassle-free size exchange and return support so you can shop with complete confidence.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-[#780016] flex items-center justify-center mx-auto">
                  <Headphones className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm font-bold text-gray-900">Direct Customer Care</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                  Dedicated assistance for measurements, order queries, and custom sizing requests.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── 8. BRAND CLOSING SECTION ── */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-[#1F0206] via-[#2A0309] to-[#0D0103] text-white text-center">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">
            <Crown className="w-8 h-8 text-[#C59B27] mx-auto" />

            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#E5B842] block">
              Wear Tradition With Dignity
            </span>

            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              Celebrate Authentic Indian Craftsmanship Every Day
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-lg mx-auto">
              Join thousands of discerning women across India who have embraced the effortless elegance, pure cotton breathability, and honest value of Nari Pehnawa.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/new-arrivals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#C59B27] hover:bg-[#A47F1D] text-[#1F0206] font-bold text-xs sm:text-sm uppercase tracking-wider transition shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-[#1F0206]" />
                <span>Shop The Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/owner"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-xs sm:text-sm uppercase tracking-wider transition shadow-sm"
              >
                <span>Meet The Founder</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── STANDALONE PREMIUM BOTTOM FOOTER ── */}
      <footer className="bg-[#0D0103] text-gray-400 border-t border-[#C59B27]/20 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:grid md:grid-cols-3 gap-6 items-center text-center md:text-left text-xs">
          <div className="space-y-1">
            <h4 className="font-serif text-base font-bold text-white tracking-[0.2em]">NARI PEHNAWA</h4>
            <p className="text-gray-400 max-w-xs mx-auto md:mx-0">
              Authentic Indian ethnic silhouettes and handloom kurtis delivered directly from artisan looms across India.
            </p>
          </div>

          <div className="flex justify-center gap-6 font-semibold text-gray-300">
            <Link to="/" className="hover:text-[#E5B842] transition">Home</Link>
            <Link to="/new-arrivals" className="hover:text-[#E5B842] transition">New Arrivals</Link>
            <Link to="/about-us" className="hover:text-[#E5B842] transition">About Us</Link>
            <Link to="/owner" className="hover:text-[#E5B842] transition">Founder Story</Link>
          </div>

          <div className="md:text-right text-gray-400">
            © 2026 Nari Pehnawa. All Rights Reserved.<br />
            Crafted with passion, trust, and dedication.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default AboutUs;
