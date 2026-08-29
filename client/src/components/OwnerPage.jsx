import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Award,
  Sparkles,
  Heart,
  Quote,
  CheckCircle2,
  Users,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ChevronDown,
  ShoppingBag,
  Store,
  Compass,
  Star,
  Layers,
  HeartHandshake,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkle,
  Gem,
  Scissors,
  Check,
  Feather
} from "lucide-react";

const OwnerPage = () => {
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    // 1. Dynamic Page Title targeting exact search queries (Owner, Founder, Malik, Pooja Verma, Ritika Singh)
    document.title = "Who is the Owner of Nari Pehnawa? | Founders Pooja Verma & Ritika Singh | Official Nari Pehnawa";

    // 2. Comprehensive Meta Tags for Search Engines & Social Media
    const metaTags = {
      description:
        "Who is the owner of Nari Pehnawa? Nari Pehnawa is owned and co-founded by Pooja Verma & Ritika Singh. Discover their inspiring story of women empowerment, authentic craftsmanship, and handcrafted Indian ethnic fashion.",
      keywords:
        "nari pehnawa owner, nari pehnawa founder, nari pehnawa malik, who is the owner of nari pehnawa, nari pehnawa founders, nari pehnawa ka malik kaun hai, pooja verma, ritika singh, pooja verma nari pehnawa, ritika singh nari pehnawa, about nari pehnawa, women ethnic wear founders, prayagraj, deoria, boutique owner india, nari pehnawa story",
      // Open Graph Tags
      "og:title": "Who is the Owner of Nari Pehnawa? | Meet Founders Pooja Verma & Ritika Singh",
      "og:description": "Nari Pehnawa was founded and is owned by Pooja Verma and Ritika Singh — bringing authentic handcrafted ethnic wear directly from Indian artisans to every home.",
      "og:image": "https://naripehnawa.com/motivational-hero.png",
      "og:url": "https://naripehnawa.com/owner",
      "og:type": "profile",
      "og:site_name": "Nari Pehnawa",
      // Twitter Card Tags
      "twitter:card": "summary_large_image",
      "twitter:title": "Who is the Owner of Nari Pehnawa? | Founders Pooja Verma & Ritika Singh",
      "twitter:description": "Meet the visionary women behind Nari Pehnawa: Pooja Verma & Ritika Singh.",
      "twitter:image": "https://naripehnawa.com/motivational-hero.png",
    };

    const elementsToCleanup = [];

    // Inject Meta Tags
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

    // Canonical link tag setup
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    let createdCanonical = false;
    let oldCanonicalHref = null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
      createdCanonical = true;
    } else {
      oldCanonicalHref = canonicalLink.getAttribute("href");
    }
    canonicalLink.setAttribute("href", "https://naripehnawa.com/owner");

    // Dynamic JSON-LD Schema (Organization, Person, FAQPage, AboutPage, BreadcrumbList)
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://naripehnawa.com/#organization",
          "name": "Nari Pehnawa",
          "url": "https://naripehnawa.com",
          "logo": {
            "@type": "ImageObject",
            "@id": "https://naripehnawa.com/#logo",
            "url": "https://naripehnawa.com/logo.png",
            "caption": "Nari Pehnawa Official Logo"
          },
          "description": "Nari Pehnawa is India's premium boutique ethnic wear brand owned and founded by Pooja Verma and Ritika Singh.",
          "foundingDate": "2024",
          "founder": [
            { "@id": "https://naripehnawa.com/#pooja_verma" },
            { "@id": "https://naripehnawa.com/#ritika_singh" }
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-98765-43210",
            "contactType": "customer service",
            "email": "support@naripehnawa.com",
            "areaServed": "IN",
            "availableLanguage": ["English", "Hindi"]
          }
        },
        {
          "@type": "Person",
          "@id": "https://naripehnawa.com/#pooja_verma",
          "name": "Pooja Verma",
          "jobTitle": "Co-Founder & Creative Director",
          "description": "Pooja Verma is the Co-Founder and Owner of Nari Pehnawa, spearheading design curation, fabric sourcing, and traditional artisan relationships.",
          "worksFor": { "@id": "https://naripehnawa.com/#organization" },
          "gender": "Female",
          "birthPlace": {
            "@type": "Place",
            "name": "Prayagraj, Uttar Pradesh, India"
          },
          "image": "https://naripehnawa.com/pooja-verma.jpg"
        },
        {
          "@type": "Person",
          "@id": "https://naripehnawa.com/#ritika_singh",
          "name": "Ritika Singh",
          "jobTitle": "Co-Founder & Managing Director",
          "description": "Ritika Singh is the Co-Founder and Owner of Nari Pehnawa, leading operations, customer experience, and transparent nationwide commerce.",
          "worksFor": { "@id": "https://naripehnawa.com/#organization" },
          "gender": "Female",
          "birthPlace": {
            "@type": "Place",
            "name": "Deoria, Uttar Pradesh, India"
          },
          "image": "https://naripehnawa.com/ritika-singh.png"
        },
        {
          "@type": "FAQPage",
          "@id": "https://naripehnawa.com/owner#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Who is the owner of Nari Pehnawa? (नारी पहनावा का मालिक कौन है?)",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nari Pehnawa is owned and co-founded by two women entrepreneurs: Pooja Verma and Ritika Singh. They started the brand with a vision to make authentic Indian handcrafted ethnic wear accessible directly from weavers to modern women."
              }
            },
            {
              "@type": "Question",
              "name": "Who are the founders of Nari Pehnawa? (नारी पहनावा के फाउंडर कौन हैं?)",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The founders of Nari Pehnawa are Pooja Verma (from Prayagraj, UP) and Ritika Singh (from Deoria, UP). Together, they manage creative design, artisan partnerships, and nationwide operations."
              }
            },
            {
              "@type": "Question",
              "name": "Where is Nari Pehnawa located and what are its roots?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nari Pehnawa is rooted in Uttar Pradesh, India (Prayagraj & Deoria) and serves customers all across India with express nationwide delivery."
              }
            },
            {
              "@type": "Question",
              "name": "What type of products does Nari Pehnawa specialize in?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nari Pehnawa specializes in premium handcrafted Anarkali Suits, Lucknowi Chikankari Kurtis, Designer Saree collections, Palazzo Sets, and contemporary ethnic wear."
              }
            }
          ]
        },
        {
          "@type": "AboutPage",
          "@id": "https://naripehnawa.com/owner#webpage",
          "url": "https://naripehnawa.com/owner",
          "name": "About Us & Founders | Nari Pehnawa - Pooja Verma & Ritika Singh",
          "isPartOf": {
            "@type": "WebSite",
            "@id": "https://naripehnawa.com/#website",
            "name": "Nari Pehnawa",
            "url": "https://naripehnawa.com"
          },
          "about": [
            { "@id": "https://naripehnawa.com/#pooja_verma" },
            { "@id": "https://naripehnawa.com/#ritika_singh" },
            { "@id": "https://naripehnawa.com/#organization" }
          ]
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://naripehnawa.com/owner#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://naripehnawa.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Meet The Founders & Owners",
              "item": "https://naripehnawa.com/owner"
            }
          ]
        }
      ]
    };

    let scriptTag = document.querySelector('script[data-schema="nari-pehnawa-founders"]');
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.setAttribute("type", "application/ld+json");
      scriptTag.setAttribute("data-schema", "nari-pehnawa-founders");
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData);

    // Scroll to top upon mounting
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      // Cleanup meta tags on unmount
      elementsToCleanup.forEach((el) => el.remove());
      if (createdCanonical && canonicalLink) {
        canonicalLink.remove();
      } else if (canonicalLink && oldCanonicalHref) {
        canonicalLink.setAttribute("href", oldCanonicalHref);
      }
      if (scriptTag) scriptTag.remove();
    };
  }, []);

  const faqs = [
    {
      q: "Who is the owner of Nari Pehnawa? (नारी पहनावा का मालिक कौन है?)",
      a: "Nari Pehnawa is owned and spearheaded by two passionate women entrepreneurs: Pooja Verma and Ritika Singh. Together, they founded the brand to deliver high-quality, handcrafted Indian ethnic wear directly from master artisans to customers across India without middlemen markups."
    },
    {
      q: "Who are the founders of Nari Pehnawa and what is their story?",
      a: "Pooja Verma (from Prayagraj, UP) and Ritika Singh (from Deoria, UP) are close friends who turned their shared dream of women empowerment and ethnic fashion into reality. Pooja leads the creative curation and fabric sourcing, while Ritika manages operations, logistics, and customer happiness."
    },
    {
      q: "Where is Nari Pehnawa located and do you deliver pan-India?",
      a: "Nari Pehnawa operates from Uttar Pradesh, India, with direct connections to traditional weavers in Lucknow, Banaras, and Jaipur. We deliver to all 28 states and 8 union territories across India with real-time tracking."
    },
    {
      q: "How does Nari Pehnawa guarantee fabric and craftsmanship quality?",
      a: "Every single piece goes through a 3-step quality inspection: fabric purity check, embroidery finish audit, and sizing calibration. We also practice 100% transparent photography without extreme studio distortion so you get exactly what you see."
    },
    {
      q: "How can I contact the founders or customer support?",
      a: "You can write directly to our executive team at support@naripehnawa.com or reach our customer care line at +91-98765-43210. Our support team is active 7 days a week."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#1E050A] antialiased selection:bg-[#D4AF37]/30 selection:text-[#580C1F] font-sans">
      
      {/* ── TOP LUXURY ANNOUNCEMENT & NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-[#FCFAF7]/95 backdrop-blur-md border-b border-[#E8DFC8]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-18 sm:h-22 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/logo.png"
              alt="Nari Pehnawa"
              className="h-10 sm:h-13 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="border-l border-[#C5A880]/40 pl-3">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-[#4A0A16] block leading-none">
                NARI PEHNAWA
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#A67C52] tracking-[0.25em] uppercase font-semibold block mt-0.5">
                Authentic Ethnic Heritage
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
            <a
              href="#founders"
              className="px-3 py-1.5 rounded-full text-[#4A0A16] hover:bg-[#4A0A16]/5 transition"
            >
              Founders
            </a>
            <a
              href="#heritage"
              className="hidden md:inline-block px-3 py-1.5 rounded-full text-stone-600 hover:text-[#4A0A16] transition"
            >
              Our Heritage
            </a>
            <a
              href="#guarantee"
              className="hidden lg:inline-block px-3 py-1.5 rounded-full text-stone-600 hover:text-[#4A0A16] transition"
            >
              The Promise
            </a>
            <a
              href="#faq"
              className="px-3 py-1.5 rounded-full text-stone-600 hover:text-[#4A0A16] transition"
            >
              FAQ
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#580C1F] to-[#3B0714] text-[#FDFBF7] rounded-full text-xs sm:text-sm font-semibold shadow-md shadow-[#580C1F]/15 hover:shadow-lg transition-all"
            >
              <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Explore Boutique</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO BANNER: HIGH-FASHION EDITORIAL PRESENTATION ── */}
      <section className="relative overflow-hidden bg-[#160307] text-[#FAF5ED] py-20 sm:py-28 lg:py-32 border-b border-[#D4AF37]/30">
        {/* Editorial Background Image with Depth Gradient Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
          style={{ backgroundImage: `url('/motivational-hero.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#160307]/90 via-[#26050D]/85 to-[#160307]" />
        
        {/* Subtle Decorative Golden Border Pattern */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

        <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-8 text-center space-y-7">
          
          {/* Verified Official Brand Leadership Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-[#D4AF37]/40 text-[#EADBBE] text-xs sm:text-sm font-medium tracking-widest uppercase shadow-xl">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span>Official Leadership &amp; Ownership</span>
          </div>

          {/* Main Hero Title */}
          <div className="space-y-3">
            <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-[#C5A880] font-semibold block">
              The Visionaries &amp; Co-Founders
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12]">
              Pooja Verma &amp; Ritika Singh
            </h1>
            <p className="font-serif italic text-lg sm:text-2xl text-[#EADBBE]/90 font-light max-w-2xl mx-auto">
              "Redefining Indian ethnic elegance with authentic artisan craftsmanship."
            </p>
          </div>

          <p className="text-xs sm:text-base text-[#FAF5ED]/80 font-light max-w-3xl mx-auto leading-relaxed">
            The inspirational story of two women entrepreneurs from Uttar Pradesh (Prayagraj &amp; Deoria) uniting traditional weaver heritage with contemporary Indian silhouettes.
          </p>

          {/* ═ GOOGLE KNOWLEDGE SNIPPET CARD (High-End Parchment Style) ═ */}
          <div className="max-w-3xl mx-auto mt-8 bg-white/10 backdrop-blur-xl border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA822A] text-[#160307] flex items-center justify-center font-bold flex-shrink-0 shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
                    Direct Search Verification
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#EADBBE] rounded-full border border-[#D4AF37]/30 font-semibold">
                    100% Verified
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                  Who is the Owner of Nari Pehnawa? (नारी पहनावा का मालिक कौन है?)
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF5ED]/90 leading-relaxed font-light">
                  <strong>Nari Pehnawa</strong> is co-founded and exclusively owned by <strong>Pooja Verma</strong> and <strong>Ritika Singh</strong>. Headquartered in Uttar Pradesh, the brand is dedicated to bringing authentic Anarkalis, Chikankari Kurtis, and Sarees directly from weavers to homes across India.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOUNDER SPOTLIGHT: EDITORIAL MASTERPIECE CARDS ── */}
      <section id="founders" className="py-16 sm:py-24 max-w-[1320px] mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A67C52] tracking-[0.25em] uppercase">
            <Feather className="w-3.5 h-3.5 text-[#D4AF37]" /> The Leadership Duo
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#4A0A16]">
            Meet The Founders
          </h2>
          <div className="w-16 h-[2px] bg-[#D4AF37] mx-auto" />
          <p className="text-xs sm:text-sm text-stone-600 font-light">
            Complementary expertise in artisanal design, fabric integrity, customer care, and operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12">
          
          {/* ═ FOUNDER 1: POOJA VERMA ═ */}
          <div className="bg-white rounded-3xl border border-[#E8DFC8] shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
            {/* Top Image Banner */}
            <div className="relative bg-[#FAF5ED] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 border-b border-[#E8DFC8]/60">
              <div className="relative flex-shrink-0">
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-3 border-[#D4AF37] shadow-xl">
                  <img
                    src="/pooja-verma.jpg"
                    alt="Pooja Verma - Founder & Creative Director of Nari Pehnawa"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { e.target.src = "/logo_square.png"; }}
                  />
                </div>
                <div className="absolute -bottom-2.5 -right-2.5 px-3 py-0.5 bg-[#4A0A16] text-[#EADBBE] text-[10px] font-bold rounded-full border border-[#D4AF37]/50 shadow-md">
                  Co-Owner
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#A67C52] block">
                  Design &amp; Craftsmanship
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A0A16]">
                  Pooja Verma
                </h3>
                <p className="text-xs font-semibold text-[#580C1F] flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Prayagraj, Uttar Pradesh
                </p>
                <div className="pt-1 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#4A0A16] font-semibold border border-[#E8DFC8]">
                    Creative Director
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#4A0A16] font-semibold border border-[#E8DFC8]">
                    Fabric Curation
                  </span>
                </div>
              </div>
            </div>

            {/* Content & Personal Statement */}
            <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between space-y-6">
              
              {/* Quote Block */}
              <div className="relative bg-[#FAF5ED] border-l-4 border-[#D4AF37] p-5 sm:p-6 rounded-r-2xl text-xs sm:text-sm text-stone-800 leading-relaxed font-serif italic shadow-inner">
                <Quote className="w-8 h-8 text-[#D4AF37]/20 absolute top-3 right-4 pointer-events-none" />
                "As the Owner of Nari Pehnawa, I focus on delivering superior quality, innovative designs, and effortless comfort. From thoughtfully crafting each design to carefully sourcing fabrics, we prioritize excellence at every stage. Our aim is to make fashion accessible, special, and unique for every woman."
              </div>

              {/* Leadership Pillars */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block">
                  Key Portfolio Areas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-700 font-medium">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Pure Handloom Sourcing</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Lucknowi Chikankari Art</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Contemporary Sizing &amp; Cuts</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Fair-Trade Artisan Support</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Accent Strip */}
            <div className="bg-[#4A0A16] text-[#FAF5ED] px-8 py-3.5 text-xs font-semibold flex items-center justify-between">
              <span className="text-[#D4AF37] font-serif italic text-sm">Craftsmanship First</span>
              <span className="text-[11px] text-[#FAF5ED]/80">Nari Pehnawa Executive Board</span>
            </div>
          </div>

          {/* ═ FOUNDER 2: RITIKA SINGH ═ */}
          <div className="bg-white rounded-3xl border border-[#E8DFC8] shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
            {/* Top Image Banner */}
            <div className="relative bg-[#FAF5ED] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 border-b border-[#E8DFC8]/60">
              <div className="relative flex-shrink-0">
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-3 border-[#D4AF37] shadow-xl">
                  <img
                    src="/ritika-singh.png"
                    alt="Ritika Singh - Founder & Managing Director of Nari Pehnawa"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { e.target.src = "/ritika-singh.jpg"; }}
                  />
                </div>
                <div className="absolute -bottom-2.5 -right-2.5 px-3 py-0.5 bg-[#4A0A16] text-[#EADBBE] text-[10px] font-bold rounded-full border border-[#D4AF37]/50 shadow-md">
                  Co-Owner
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#A67C52] block">
                  Operations &amp; Customer Trust
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A0A16]">
                  Ritika Singh
                </h3>
                <p className="text-xs font-semibold text-[#580C1F] flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Deoria, Uttar Pradesh
                </p>
                <div className="pt-1 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#4A0A16] font-semibold border border-[#E8DFC8]">
                    Managing Director
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#4A0A16] font-semibold border border-[#E8DFC8]">
                    Customer Experience
                  </span>
                </div>
              </div>
            </div>

            {/* Content & Personal Statement */}
            <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between space-y-6">
              
              {/* Quote Block */}
              <div className="relative bg-[#FAF5ED] border-l-4 border-[#D4AF37] p-5 sm:p-6 rounded-r-2xl text-xs sm:text-sm text-stone-800 leading-relaxed font-serif italic shadow-inner">
                <Quote className="w-8 h-8 text-[#D4AF37]/20 absolute top-3 right-4 pointer-events-none" />
                "Nari Pehnawa represents every woman who dares to dream big. Coming from Deoria, I envisioned an Indian brand where every customer receives genuine boutique quality without artificial markups, backed by trustworthy customer care and transparent delivery."
              </div>

              {/* Leadership Pillars */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block">
                  Key Portfolio Areas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-700 font-medium">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Nationwide Express Logistics</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Transparent Honest Pricing</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>Quality Inspection Protocols</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/50">
                    <Check className="w-4 h-4 text-[#4A0A16] flex-shrink-0" />
                    <span>24/7 Shopper Satisfaction</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Accent Strip */}
            <div className="bg-[#4A0A16] text-[#FAF5ED] px-8 py-3.5 text-xs font-semibold flex items-center justify-between">
              <span className="text-[#D4AF37] font-serif italic text-sm">Customer First</span>
              <span className="text-[11px] text-[#FAF5ED]/80">Nari Pehnawa Executive Board</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION: OUR HERITAGE JOURNEY (THE STORY OF TWO FRIENDS) ── */}
      <section id="heritage" className="py-16 sm:py-24 bg-white border-y border-[#E8DFC8]/60">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14 sm:mb-20">
            <span className="text-xs font-bold text-[#A67C52] tracking-[0.25em] uppercase block">
              From Prayagraj &amp; Deoria to Pan-India
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#4A0A16]">
              The Story Behind Nari Pehnawa
            </h2>
            <div className="w-16 h-[2px] bg-[#D4AF37] mx-auto" />
            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              How two friends from small towns of Uttar Pradesh turned their passion for handloom and self-reliance into a trusted Indian boutique brand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-[#FCFAF7] p-8 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#4A0A16] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-lg shadow-md">
                01
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A0A16]">
                The Vision in Small-Town UP
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                Growing up in Prayagraj and Deoria, Pooja and Ritika witnessed firsthand that boutique ethnic fashion was either overpriced or compromised on quality. They set out with a simple pledge: genuine craft without exorbitant prices.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FCFAF7] p-8 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#4A0A16] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-lg shadow-md">
                02
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A0A16]">
                Artisan Handloom Networks
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                They established direct connections with master handloom weavers in Varanasi, Lucknow, and Jaipur. By removing intermediary layers, artisans receive fair compensation and customers receive genuine hand-embroidery.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FCFAF7] p-8 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#4A0A16] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-lg shadow-md">
                03
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A0A16]">
                Empowering Indian Women
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                Today, Nari Pehnawa serves thousands of proud women across India. Every order placed supports independent female leadership and authentic Indian textile heritage.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION: 4 BRAND COMMITMENTS & TRUST GUARANTEES ── */}
      <section id="guarantee" className="py-16 sm:py-24 max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-[#A67C52] tracking-[0.25em] uppercase block">
            Guaranteed Standards
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A0A16]">
            The 4 Nari Pehnawa Promises
          </h2>
          <div className="w-16 h-[2px] bg-[#D4AF37] mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-7 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A0A16]/10 text-[#4A0A16] flex items-center justify-center">
              <Gem className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A0A16]">100% Quality Fabric</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Pure georgettes, breathable mulmul, and rich chanderis tested rigorously for colorfastness and drape.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A0A16]/10 text-[#4A0A16] flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A0A16]">Authentic Tailoring</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Precision stitching, reinforced seams, and inclusive standard Indian sizing designed for everyday grace.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A0A16]/10 text-[#4A0A16] flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A0A16]">Zero-Filter Photos</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              We shoot all products under natural light without exaggerated filters so what you see is what you receive.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A0A16]/10 text-[#4A0A16] flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#4A0A16]">Founder Backing</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Direct oversight on customer support, fast dispatch, real-time tracking, and simple return assistance.
            </p>
          </div>

        </div>
      </section>

      {/* ── SECTION: FREQUENTLY ASKED QUESTIONS (SEARCH ACCORDION) ── */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-t border-[#E8DFC8]/60">
        <div className="max-w-[960px] mx-auto px-4 sm:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A67C52] tracking-[0.25em] uppercase">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" /> Frequently Asked Questions
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#4A0A16]">
              Everything You Need to Know
            </h2>
            <div className="w-16 h-[2px] bg-[#D4AF37] mx-auto" />
            <p className="text-xs sm:text-sm text-stone-600 font-light">
              Verified answers to common queries about Nari Pehnawa, the founders, and our product heritage.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E8DFC8] bg-[#FAF8F5] overflow-hidden transition-all duration-300 shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-serif font-bold text-sm sm:text-base text-[#4A0A16] hover:text-[#580C1F] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#A67C52] flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#4A0A16]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-stone-700 leading-relaxed font-light border-t border-[#E8DFC8]/50 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION: A PERSONAL LETTER TO OUR CUSTOMERS ── */}
      <section className="py-20 sm:py-28 bg-[#160307] text-[#FAF5ED] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-[#580C1F] to-black" />

        <div className="relative z-10 max-w-[880px] mx-auto px-4 sm:px-8 text-center space-y-7">
          <Quote className="w-12 h-12 text-[#D4AF37]/30 mx-auto" />
          
          <span className="text-xs font-bold text-[#D4AF37] tracking-[0.25em] uppercase block">
            A Message From Our Founders
          </span>

          <blockquote className="font-serif text-lg sm:text-2xl lg:text-3xl text-white/95 font-medium italic leading-relaxed">
            "When you choose Nari Pehnawa, you aren't just wearing an outfit — you are supporting our vision of female self-reliance and Indian craftsmanship. We promise to uphold your faith with integrity, grace, and exquisite ethnic creations."
          </blockquote>

          <div className="pt-4 space-y-1">
            <h4 className="font-bold text-[#EADBBE] tracking-widest text-base sm:text-lg">
              — Pooja Verma &amp; Ritika Singh
            </h4>
            <p className="text-xs text-[#FAF5ED]/70 tracking-widest uppercase font-light">
              Founders &amp; Owners, Nari Pehnawa
            </p>
          </div>

          <div className="pt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-[#D4AF37] to-[#C5A880] text-[#160307] font-bold text-sm sm:text-base rounded-full shadow-xl hover:shadow-2xl hover:brightness-105 transition duration-300"
            >
              <span>Explore The Boutique Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── LUXURY MINIMAL FOOTER ── */}
      <footer className="bg-[#100204] text-[#FAF5ED]/75 border-t border-[#580C1F]/40 py-10 px-4 sm:px-8">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left text-xs">
          <div className="space-y-1">
            <span className="font-serif text-base font-bold text-white tracking-widest block">
              NARI PEHNAWA
            </span>
            <p className="text-[11px] text-stone-400">
              Official Founders &amp; Ownership Portal • Founded &amp; Owned by Pooja Verma &amp; Ritika Singh
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 font-semibold text-stone-300">
            <Link to="/" className="hover:text-[#D4AF37] transition">Home</Link>
            <Link to="/new-arrivals" className="hover:text-[#D4AF37] transition">New Arrivals</Link>
            <Link to="/category/sale" className="hover:text-[#D4AF37] transition">Sale</Link>
            <Link to="/support/contact-us" className="hover:text-[#D4AF37] transition">Contact Us</Link>
          </div>

          <div className="text-[11px] text-stone-500">
            © 2026 Nari Pehnawa. All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default OwnerPage;
