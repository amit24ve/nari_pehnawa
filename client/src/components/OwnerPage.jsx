import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Crown,
  CheckCircle2,
  Quote,
  MapPin,
  GraduationCap,
  Scissors,
  Star,
  Check,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const OwnerPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const oldTitle = document.title;
    document.title = "Meet The Founder & Creative Director | Pooja Verma — Nari Pehnawa";

    const metaTags = {
      description:
        "Meet Pooja Verma, the Founder and Creative Director behind Nari Pehnawa. Discover her inspiring journey of championing women self-reliance, authentic handloom heritage, and affordable luxury fashion.",
      keywords:
        "Nari Pehnawa, Nari Pehnawa Founder, Pooja Verma, Pooja Verma Nari Pehnawa, Women Entrepreneurship, Indian Ethnic Wear, Handloom Heritage, Authentic Kurtis, Handcrafted Fashion India",
      "og:title": "Meet The Founder & Creative Director | Pooja Verma — Nari Pehnawa",
      "og:description":
        "Discover the journey of Pooja Verma, Founder of Nari Pehnawa — bringing honest artisan handloom fashion and women self-reliance to wardrobes across India.",
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#FDFBF7] text-gray-900 font-sans selection:bg-[#780016] selection:text-white">
      
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
        <section className="relative py-14 sm:py-24 bg-gradient-to-b from-[#1F0206] via-[#2D040A] to-[#1A0105] text-white overflow-hidden text-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C59B27] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-[#C59B27]/60 text-amber-200 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Haute Couture • Empowerment • Heritage</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Meet The Visionary <span className="text-[#E5B842] italic font-serif">Founder</span>
            </h1>

            <p className="text-xs sm:text-base text-amber-100/90 font-light max-w-xl mx-auto leading-relaxed">
              The creative passion, entrepreneurial dedication, and unwavering pursuit of female self-reliance that birthed <strong className="font-semibold text-white">Nari Pehnawa</strong>.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C59B27]" />
              <Crown className="w-4 h-4 text-[#C59B27]" />
              <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C59B27]" />
            </div>
          </div>
        </section>

        {/* ── SECTION 1: FOUNDER SHOWCASE (NO BUTTONS, BALANCED LUXURY LAYOUT) ── */}
        <section className="py-10 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-14">
            
            {/* PORTRAIT */}
            <div className="w-full max-w-[320px] sm:max-w-[360px] flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative p-2 rounded-3xl bg-gradient-to-b from-[#C59B27]/40 via-[#E8DFC8]/30 to-[#C59B27]/20 shadow-2xl">
                <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-[#C59B27]/50 aspect-[3/4] shadow-inner group">
                  <img
                    src="/pooja-verma.jpg"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.triedJpeg) {
                        e.currentTarget.dataset.triedJpeg = "true";
                        e.currentTarget.src = "/pooja-verma.jpeg";
                      }
                    }}
                    alt="Pooja Verma - Founder and Creative Director of Nari Pehnawa"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                  <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#C59B27]/80 text-amber-200 text-[10px] sm:text-xs font-bold tracking-wider shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Founder &amp; Owner</span>
                  </div>

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-center">
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-white tracking-wide">
                      Pooja Verma
                    </h3>
                    <p className="text-[11px] text-[#E5B842] uppercase tracking-[0.18em] font-medium mt-0.5">
                      Founder &amp; Creative Director
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOUNDER EDITORIAL BIO */}
            <div className="flex-1 space-y-6 text-left w-full">
              
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016] flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>The Driving Force Behind The Brand</span>
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Pooja Verma
                </h2>
                <p className="text-sm sm:text-base font-serif italic text-[#780016] font-semibold">
                  Founder, Creative Visionary &amp; Chief Curator at Nari Pehnawa
                </p>
              </div>

              {/* Natural Editorial Blockquote */}
              <blockquote className="relative pl-5 sm:pl-6 border-l-2 border-[#C59B27] space-y-2 py-1">
                <Quote className="w-6 h-6 text-[#C59B27]/60" />
                <p className="font-serif text-sm sm:text-lg text-gray-800 italic leading-relaxed">
                  "From childhood, my deepest ambition was to carve my own identity, stand independently on my own feet, and provide Indian women with ethnic wear that carries the dignity of handloom heritage along with the comfort of honest pricing. Nari Pehnawa is not merely a label — it is a movement of women's self-reliance, authenticity, and enduring trust."
                </p>
                <cite className="block text-xs font-bold text-[#780016] not-italic pt-1 tracking-wider uppercase">
                  — Pooja Verma (Founder &amp; Creative Director)
                </cite>
              </blockquote>

              {/* Heritage, Roots & Craft Pedigree */}
              <div className="pt-4 border-t border-[#E8DFC8]/80">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#780016] mb-3">
                  Heritage, Roots &amp; Craft Pedigree
                </h4>
                <div className="divide-y divide-[#E8DFC8]/60 text-xs sm:text-sm text-gray-700">
                  <div className="py-2.5 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#780016] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-900 font-semibold">Hometown &amp; Regional Heritage: </span>
                      <span className="text-gray-600">Deoria, Uttar Pradesh — deeply immersed in the traditional handloom weaving belts of Purvanchal.</span>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-3">
                    <GraduationCap className="w-4 h-4 text-[#780016] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-900 font-semibold">Academic Foundation: </span>
                      <span className="text-gray-600">B.A. Graduate from Sultanpur, nurturing a steadfast vision for female entrepreneurship.</span>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-3">
                    <Scissors className="w-4 h-4 text-[#780016] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-900 font-semibold">Master Sourcing &amp; Tailoring Standards: </span>
                      <span className="text-gray-600">In-person yarn inspection, pure botanical dyes, and precision inner-margin tailoring.</span>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-3">
                    <Star className="w-4 h-4 text-[#C59B27] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-900 font-semibold">Brand Vision: </span>
                      <span className="text-gray-600">Pioneering women self-reliance by connecting skilled weavers directly with modern Indian wardrobes at fair prices.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Core Quality Commitments */}
              <div className="space-y-2.5 pt-4 border-t border-[#E8DFC8]/80 text-xs sm:text-sm text-gray-700">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><strong className="text-gray-900">Personally Hand-Testing Every Fabric:</strong> Pure breathable cotton density, skin-kind natural dyes, and pre-shrink washing before crafting.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><strong className="text-gray-900">Direct Artisan Looms:</strong> Zero middleman markups so Indian families receive genuine bridal-grade and festive quality affordably.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <span><strong className="text-gray-900">Real Indian Silhouette Margins:</strong> Thoughtfully designed armholes and generous 2-3 inch inner margins suited for real Indian body shapes.</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── SECTION 2: THE ORIGIN STORY ── */}
        <section className="py-12 sm:py-20 bg-[#FAF7F2] border-y border-[#E8DFC8]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-2 mb-8 sm:mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">Our Roots &amp; Journey</span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
                The Story Behind <span className="text-[#780016] italic font-serif">Nari Pehnawa</span>
              </h3>
              <div className="w-16 h-0.5 bg-[#C59B27] mx-auto mt-2" />
            </div>

            <div className="space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed font-normal">
              <p>
                <strong className="text-gray-900 font-semibold">Nari Pehnawa</strong> was born out of a simple yet transformative dream: to make genuine, royal Indian ethnic fashion accessible, comfortable, and celebratory for every woman across the country. Founded by <strong className="text-[#780016]">Pooja Verma</strong>, the brand stands as an authentic testament to woman-led entrepreneurship and grassroots handloom preservation.
              </p>
              <p>
                Growing up in Deoria, Uttar Pradesh, and later pursuing her higher education in Sultanpur, Pooja recognized a recurring void in the retail market. High-end boutiques marketed luxury ethnic wear at inaccessible prices, while fast-fashion commercial outlets frequently compromised on pure cotton weaves, natural breathability, and reliable silhouettes.
              </p>
              <p>
                Determined to build an independent brand grounded in integrity, Pooja bypassed corporate middlemen and traveled directly to traditional artisan weaving clusters across Uttar Pradesh. She immersed herself in the craftsmanship of master weavers, learning the meticulous art of thread counts, yarn density, block printing, and lock-stitch tailoring.
              </p>
              <p>
                Today, Nari Pehnawa bridges the gap between rural artisan excellence and the discerning modern Indian woman. Every single kurti, suit, and festive ensemble that leaves the workshop reflects Pooja’s personal seal of quality, honest pricing, and deep pride in Indian handloom traditions.
              </p>

              <div className="p-5 sm:p-6 rounded-2xl bg-[#F4EDE0] border-l-4 border-[#C59B27] text-xs sm:text-sm space-y-1.5 mt-6">
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#780016] block">
                  The Founder's Core Mission
                </span>
                <p className="font-serif text-sm sm:text-base font-semibold text-gray-900 italic">
                  "To deliver heirloom-grade, breathable, and regal Indian ethnic wear into every household — sourced directly from artisan looms with complete transparency and fair pricing."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: CRAFTSMANSHIP & SOURCING ── */}
        <section className="py-14 sm:py-24 bg-[#1F0206] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-2.5 mb-10 sm:mb-16">
              <span className="text-[#E5B842] text-xs font-bold uppercase tracking-[0.2em]">Curation &amp; Quality Protocols</span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                How Pooja Curates <span className="text-[#E5B842] italic font-serif">Every Outfit</span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/80 font-light">
                From yarn density inspection to seam reinforcement, each piece undergoes meticulous quality checks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
              <div className="space-y-3 border-t border-[#C59B27]/30 pt-6">
                <span className="font-serif text-3xl font-bold text-[#E5B842] block">01.</span>
                <h4 className="font-serif text-lg font-bold text-white">Direct Weaver Sourcing</h4>
                <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                  In-person selection from handloom clusters across Uttar Pradesh. Testing cotton breathability, dye fastness, and drape fall before finalizing any fabric batch.
                </p>
              </div>

              <div className="space-y-3 border-t border-[#C59B27]/30 pt-6">
                <span className="font-serif text-3xl font-bold text-[#E5B842] block">02.</span>
                <h4 className="font-serif text-lg font-bold text-white">Reinforced Lock-Stitch Seams</h4>
                <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                  Every kurti, dupatta, and trouser features high-density lock stitching at stress points to ensure enduring durability through repeated daily and festive wear.
                </p>
              </div>

              <div className="space-y-3 border-t border-[#C59B27]/30 pt-6">
                <span className="font-serif text-3xl font-bold text-[#E5B842] block">03.</span>
                <h4 className="font-serif text-lg font-bold text-white">Authentic Indian Fitting Margins</h4>
                <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                  Generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian body contours, ensuring freedom of movement and graceful posture.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: THE FOUR BRAND PILLARS ── */}
        <section className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#780016]">Our Core Pillars</span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              Why Discerning Women Choose Nari Pehnawa
            </h3>
            <div className="w-12 h-0.5 bg-[#C59B27] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2 border-l-2 border-[#C59B27] pl-4">
              <span className="font-serif text-2xl font-bold text-[#C59B27] block">01.</span>
              <h4 className="font-serif text-lg font-bold text-gray-900">Affordable Luxury</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                By eliminating distributor and middleman markups, authentic ethnic grandeur remains within honest reach.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-4">
              <span className="font-serif text-2xl font-bold text-[#C59B27] block">02.</span>
              <h4 className="font-serif text-lg font-bold text-gray-900">Personal Dedication</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                Pooja personally reviews silhouette feedback, drape textures, and bespoke size options to ensure complete customer delight.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-4">
              <span className="font-serif text-2xl font-bold text-[#C59B27] block">03.</span>
              <h4 className="font-serif text-lg font-bold text-gray-900">Women Self-Reliance</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                Directly supporting local women tailors and artisan families while illustrating the power of women-led enterprises.
              </p>
            </div>

            <div className="space-y-2 border-l-2 border-[#C59B27] pl-4">
              <span className="font-serif text-2xl font-bold text-[#C59B27] block">04.</span>
              <h4 className="font-serif text-lg font-bold text-gray-900">All-Day Breathable Comfort</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                Skin-kind natural cotton and soft weave fabrics tailored to stay featherlight through long office, celebration, and family days.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FOUNDER'S PERSONAL LETTER (ZERO WHATSAPP BUTTONS) ── */}
        <section className="py-14 sm:py-24 bg-gradient-to-br from-[#150205] via-[#220308] to-[#0D0103] text-white text-center">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
            <Quote className="w-10 h-10 text-[#C59B27]/50 mx-auto" />

            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#E5B842] font-bold block">
              A Personal Note From The Founder
            </span>

            <blockquote className="font-serif text-base sm:text-xl text-white/95 font-medium italic leading-relaxed">
              "Every outfit you order from Nari Pehnawa represents a profound vote of trust in our artisans and our dreams. I personally promise that each thread, seam, and silhouette will deliver the warmth, purity, and effortless grace that I seek for my own family."
            </blockquote>

            <div className="space-y-0.5 pt-2">
              <h4 className="font-serif font-bold text-[#E5B842] text-lg sm:text-xl tracking-wide">
                — Pooja Verma
              </h4>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">
                Founder &amp; Creative Director, Nari Pehnawa
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/new-arrivals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C59B27] to-[#A47F1D] text-[#1F0206] font-bold text-xs sm:text-sm tracking-wider uppercase hover:scale-105 transition shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-[#1F0206]" />
                <span>Shop The Handcrafted Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-sm"
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
