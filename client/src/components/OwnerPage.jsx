import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Crown,
  Quote,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  HeartHandshake
} from "lucide-react";

const OwnerPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const oldTitle = document.title;
    document.title = "Meet The Founder & Creative Director | Pooja Verma — Nari Pehnawa";

    const metaTags = {
      description:
        "Meet Pooja Verma, the Founder and Creative Director behind Nari Pehnawa. Discover her journey of women self-reliance, authentic handloom heritage, and affordable luxury ethnic fashion.",
      keywords:
        "Nari Pehnawa, Nari Pehnawa Founder, Pooja Verma, Pooja Verma Nari Pehnawa, Women Entrepreneurship, Indian Ethnic Wear, Handloom Heritage, Authentic Kurtis, Handcrafted Fashion India",
      "og:title": "Meet The Founder & Creative Director | Pooja Verma — Nari Pehnawa",
      "og:description":
        "Discover the journey of Pooja Verma, Founder of Nari Pehnawa — authentic handloom fashion directly from artisan looms.",
      "og:image": "https://www.naripehnawa.com/pooja-verma.jpg",
      "og:url": "https://www.naripehnawa.com/owner",
      "og:type": "profile",
      "og:site_name": "Nari Pehnawa",
      "twitter:card": "summary_large_image",
      "twitter:title": "Meet Pooja Verma | Founder & Creative Director — Nari Pehnawa",
      "twitter:description":
        "Discover the journey of Pooja Verma, Founder of Nari Pehnawa — authentic handloom fashion directly from artisan looms.",
      "twitter:image": "https://www.naripehnawa.com/pooja-verma.jpg",
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
      } else if (key.startsWith("twitter:")) {
        el = document.querySelector(`meta[name="${key}"]`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("name", key);
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

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#FAF7F2] text-gray-900 font-sans selection:bg-[#780016] selection:text-white">
      
      {/* ── TOP LUXURY BAR & NAVIGATION ── */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFC8]/60 shadow-xs">
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
              to="/new-arrivals"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-[#780016] hover:bg-[#5A0010] text-white transition-all shadow-sm"
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
          <span className="text-[#780016] font-semibold">Founder &amp; Creative Director</span>
        </div>
      </nav>

      <main className="flex-grow w-full overflow-x-hidden">

        {/* ── HERO BANNER ── */}
        <section className="relative py-12 sm:py-20 bg-gradient-to-b from-[#1F0206] via-[#2D040A] to-[#1A0105] text-white overflow-hidden text-center">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C59B27] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C59B27]/50 text-amber-200 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Haute Couture • Empowerment • Heritage</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Meet The <span className="text-[#E5B842] italic font-serif">Founder</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-amber-100/90 font-light max-w-xl mx-auto leading-relaxed">
              The creative vision and entrepreneurial heart behind <strong className="font-semibold text-white">Nari Pehnawa</strong>.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C59B27]" />
              <Crown className="w-4 h-4 text-[#C59B27]" />
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C59B27]" />
            </div>
          </div>
        </section>

        {/* ── SECTION 1: FOUNDER EDITORIAL SHOWCASE (NO BOXED CARDS, HIGH-FASHION EDITORIAL SPREAD) ── */}
        {/* Responsive Order: Mobile = Portrait FIRST, Details SECOND; Desktop = 2-Column Spread */}
        <section className="py-10 sm:py-16 md:py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:grid md:grid-cols-12 md:gap-12 lg:gap-16 items-start">
            
            {/* PORTRAIT (Mobile: First; Desktop: Left Column 5 cols) */}
            <div className="w-full md:col-span-5 flex flex-col items-center mb-8 md:mb-0">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-none">
                
                {/* Refined Luxury Portrait Frame with Minimalist Gold Outline */}
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-900 shadow-xl border border-[#C59B27]/40 ring-1 ring-[#C59B27]/20 ring-offset-4 ring-offset-[#FAF7F2]">
                  <img
                    src="/pooja-verma.jpg"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.triedJpeg) {
                        e.currentTarget.dataset.triedJpeg = "true";
                        e.currentTarget.src = "/pooja-verma.jpeg";
                      }
                    }}
                    alt="Pooja Verma - Founder and Creative Director of Nari Pehnawa"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                  {/* Clean Bottom Overlay Tag */}
                  <div className="absolute bottom-3 left-3 right-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#C59B27]/70 text-[#E5B842] text-[11px] font-bold tracking-wider uppercase">
                      <Crown className="w-3 h-3 text-[#C59B27]" />
                      <span>Founder &amp; Owner</span>
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* FOUNDER EDITORIAL DOSSIER (Mobile: Second; Desktop: Right Column 7 cols) - NO BOXED CARDS */}
            <div className="w-full md:col-span-7 flex flex-col space-y-6">
              
              {/* Monogram & Title */}
              <div className="space-y-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#780016] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>The Driving Force Behind The Label</span>
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F0206] leading-tight tracking-tight">
                  Pooja Verma
                </h2>
                <p className="font-serif text-sm sm:text-base italic text-[#780016] font-medium">
                  Founder, Creative Visionary &amp; Chief Curator at Nari Pehnawa
                </p>
              </div>

              {/* Minimalist Editorial Quote */}
              <div className="relative pl-4 border-l-2 border-[#C59B27] py-1">
                <p className="font-serif text-sm sm:text-base text-gray-800 italic leading-relaxed">
                  "My dream has always been to weave the regal dignity of authentic Indian handlooms into effortless everyday silhouettes — handcrafted for women, by women, with honest pricing and lasting trust."
                </p>
                <span className="block text-[11px] font-bold text-[#780016] uppercase tracking-[0.18em] mt-2">
                  — Pooja Verma
                </span>
              </div>

              {/* Founder Credentials Dossier — Minimalist Clean Lines, No Chunky Cards */}
              <div className="border-y border-[#E8DFC8] divide-y divide-[#E8DFC8]/70 py-1">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-36 flex-shrink-0">
                    Origin &amp; Roots
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                    Deoria, Uttar Pradesh <span className="text-gray-500 font-normal sm:inline block">(Purvanchal Handloom Belt)</span>
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-36 flex-shrink-0">
                    Education
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                    Bachelor of Arts (B.A.) <span className="text-gray-500 font-normal sm:inline block">(Sultanpur University)</span>
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-36 flex-shrink-0">
                    Craft Expertise
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                    Direct Loom Curation &amp; Pure Cotton Density Testing
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-36 flex-shrink-0">
                    Core Mission
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                    Women Self-Reliance, Artisan Empowerment &amp; Honest Value
                  </span>
                </div>
              </div>

              {/* Refined Quality Highlights */}
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-[#780016] flex-shrink-0 mt-0.5" />
                  <span><strong>100% Breathable Cotton:</strong> Natural skin-kind dyes and hand-tested yarn breathability for long daily wear.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-[#780016] flex-shrink-0 mt-0.5" />
                  <span><strong>True Indian Fit Margins:</strong> 2 to 3-inch built-in inner margins tailored for real Indian body contours.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-[#780016] flex-shrink-0 mt-0.5" />
                  <span><strong>Direct-From-Loom Pricing:</strong> Eliminating distributor middleman markups so luxury ethnic wear stays accessible.</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── SECTION 2: THE ORIGIN STORY (EDITORIAL NARRATIVE ESSAY) ── */}
        <section className="py-12 sm:py-18 bg-white border-y border-[#E8DFC8]/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-2 mb-8 sm:mb-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">Our Roots &amp; Journey</span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
                The Story Behind <span className="text-[#780016] italic font-serif">Nari Pehnawa</span>
              </h3>
              <div className="w-14 h-0.5 bg-[#C59B27] mx-auto mt-2" />
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
              <p>
                <strong className="text-gray-900 font-semibold">Nari Pehnawa</strong> was born out of a simple yet transformative dream: to make genuine, royal Indian ethnic fashion accessible, comfortable, and celebratory for every woman across the country. Founded by <strong className="text-[#780016]">Pooja Verma</strong>, the brand stands as an authentic testament to woman-led entrepreneurship and grassroots handloom preservation.
              </p>
              <p>
                Growing up in Deoria, Uttar Pradesh, and later completing her higher graduation in Sultanpur, Pooja recognized a recurring void in the ethnic wear market. Boutiques charged exorbitant prices, while commercial mass-market labels frequently compromised on pure cotton breathability, fabric longevity, and realistic silhouette fits.
              </p>
              <p>
                Determined to build an independent brand grounded in integrity, Pooja bypassed corporate middlemen and traveled directly to traditional artisan weaving clusters across Uttar Pradesh. She studied thread counts, yarn densities, vegetable dyes, and lock-stitch tailoring directly alongside generational master weavers.
              </p>
              <p>
                Today, Nari Pehnawa connects rural artisan excellence with modern Indian wardrobes nationwide. Every single kurti, suit, and festive ensemble carries Pooja’s personal seal of quality, honest pricing, and genuine pride in Indian handloom traditions.
              </p>

              <div className="pl-4 sm:pl-5 border-l-2 border-[#C59B27] py-2 mt-6">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-[#780016] block mb-1">
                  The Founder's Core Mission
                </span>
                <p className="font-serif text-xs sm:text-sm font-semibold text-gray-900 italic">
                  "To deliver heirloom-grade, breathable, and regal Indian ethnic wear into every household — straight from artisan looms with complete transparency and fair pricing."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: CRAFTSMANSHIP & SOURCING (MINIMALIST EDITORIAL) ── */}
        <section className="py-14 sm:py-20 bg-[#1F0206] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-2 mb-10 sm:mb-14">
              <span className="text-[#E5B842] text-xs font-bold uppercase tracking-[0.2em]">Curation &amp; Quality Protocols</span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                How Pooja Curates <span className="text-[#E5B842] italic font-serif">Every Outfit</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/80 font-light">
                From yarn density inspection to seam reinforcement, each piece undergoes meticulous quality checks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2.5 border-t border-[#C59B27]/40 pt-5">
                <span className="font-serif text-2xl font-bold text-[#E5B842] block">01.</span>
                <h4 className="font-serif text-lg font-bold text-white">Direct Weaver Sourcing</h4>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  In-person selection from handloom clusters across Uttar Pradesh. Testing cotton breathability, dye fastness, and drape fall before finalizing any fabric batch.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-[#C59B27]/40 pt-5">
                <span className="font-serif text-2xl font-bold text-[#E5B842] block">02.</span>
                <h4 className="font-serif text-lg font-bold text-white">Reinforced Lock-Stitch Seams</h4>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  Every kurti, dupatta, and trouser features high-density lock stitching at stress points to ensure enduring durability through repeated daily and festive wear.
                </p>
              </div>

              <div className="space-y-2.5 border-t border-[#C59B27]/40 pt-5">
                <span className="font-serif text-2xl font-bold text-[#E5B842] block">03.</span>
                <h4 className="font-serif text-lg font-bold text-white">Authentic Indian Fitting Margins</h4>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  Generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian body contours, ensuring freedom of movement and graceful posture.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: THE FOUR BRAND PILLARS (EDITORIAL LAYOUT) ── */}
        <section className="py-12 sm:py-18 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">Our Core Pillars</span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              Why Discerning Women Choose Nari Pehnawa
            </h3>
            <div className="w-12 h-0.5 bg-[#C59B27] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">01.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">Affordable Luxury</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                By eliminating distributor and middleman markups, authentic ethnic grandeur remains within honest reach.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">02.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">Personal Dedication</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Pooja personally reviews silhouette feedback, drape textures, and bespoke size options to ensure complete customer delight.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">03.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">Women Self-Reliance</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Directly supporting local women tailors and artisan families while illustrating the power of women-led enterprises.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-3.5">
              <span className="font-serif text-xl font-bold text-[#C59B27] block">04.</span>
              <h4 className="font-serif text-base font-bold text-gray-900">All-Day Breathable Comfort</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                Skin-kind natural cotton and soft weave fabrics tailored to stay featherlight through long office, celebration, and family days.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FOUNDER'S PERSONAL LETTER (ZERO WHATSAPP BUTTONS) ── */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-[#150205] via-[#220308] to-[#0D0103] text-white text-center">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">
            <Quote className="w-8 h-8 text-[#C59B27]/60 mx-auto" />

            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#E5B842] font-bold block">
              A Personal Note From The Founder
            </span>

            <blockquote className="font-serif text-base sm:text-lg text-white/95 font-medium italic leading-relaxed">
              "Every outfit you order from Nari Pehnawa represents a profound vote of trust in our artisans and our dreams. I personally promise that each thread, seam, and silhouette will deliver the warmth, purity, and effortless grace that I seek for my own family."
            </blockquote>

            <div className="space-y-0.5 pt-1">
              <h4 className="font-serif font-bold text-[#E5B842] text-lg sm:text-xl tracking-wide">
                — Pooja Verma
              </h4>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">
                Founder &amp; Creative Director, Nari Pehnawa
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/new-arrivals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#C59B27] to-[#A47F1D] text-[#1F0206] font-bold text-xs sm:text-sm tracking-wider uppercase hover:opacity-95 transition shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-[#1F0206]" />
                <span>Shop The Handcrafted Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-sm"
              >
                <span>Back To Home</span>
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
              Founded by Pooja Verma • Authentic Indian handloom and ethnic silhouettes delivered with love across India.
            </p>
          </div>

          <div className="flex justify-center gap-6 font-semibold text-gray-300">
            <Link to="/" className="hover:text-[#E5B842] transition">Home</Link>
            <Link to="/new-arrivals" className="hover:text-[#E5B842] transition">New Arrivals</Link>
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

export default OwnerPage;