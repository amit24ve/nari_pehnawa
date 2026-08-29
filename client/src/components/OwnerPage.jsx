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
  Sparkle
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
    <div className="min-h-screen bg-[#FAF6F0] text-[#120202] antialiased selection:bg-[#d4af37]/30 selection:text-[#580C1F]">
      
      {/* ── STICKY LUXURY NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#c5a880]/25 shadow-xs">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Nari Pehnawa"
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <span className="font-serif text-lg font-bold text-[#580C1F] tracking-wide block leading-none">
                NARI PEHNAWA
              </span>
              <span className="text-[10px] text-[#c5a880] tracking-widest uppercase font-semibold">
                Traditional Ka Tadka
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold">
            <a
              href="#founders"
              className="px-3 py-1.5 rounded-full text-[#580C1F] hover:bg-[#580C1F]/5 transition"
            >
              Founders
            </a>
            <a
              href="#story"
              className="hidden md:inline-block px-3 py-1.5 rounded-full text-zinc-700 hover:text-[#580C1F] transition"
            >
              Our Story
            </a>
            <a
              href="#faq"
              className="px-3 py-1.5 rounded-full text-zinc-700 hover:text-[#580C1F] transition"
            >
              FAQ
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#580C1F] hover:bg-[#430816] text-[#F7ECE1] rounded-full text-xs font-bold shadow-md shadow-[#580C1F]/15 transition duration-200"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Visit Boutique</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO BANNER SECTION (ROYAL MAROON & GOLD LUXURY) ── */}
      <section className="relative overflow-hidden bg-[#180407] text-[#F7ECE1] py-16 sm:py-24 md:py-28 border-b border-[#c5a880]/30">
        {/* Background Decorative Pattern & Glows */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url('/motivational-hero.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#180407] via-[#180407]/80 to-[#24060C]/90" />
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Verified Official Brand Leadership Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#dfc384] text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-inner">
            <Sparkles className="w-4 h-4 text-[#d4af37] animate-pulse" />
            Official Verified Leadership &amp; Ownership
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.15]">
            Meet The <span className="text-[#dfc384] italic font-serif">Founders &amp; Owners</span>
            <br />
            of Nari Pehnawa
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-[#F7ECE1]/90 font-light max-w-3xl mx-auto leading-relaxed">
            The inspiring journey of two friends, <strong>Pooja Verma</strong> and <strong>Ritika Singh</strong>, building a trusted Indian ethnic wear brand celebrating self-reliance, elegance, and artisanal heritage.
          </p>

          {/* ═ DIRECT GOOGLE SNIPPET / QUICK ANSWER BOX ═ */}
          <div className="max-w-3xl mx-auto mt-8 bg-white/10 backdrop-blur-md border border-[#d4af37]/40 rounded-3xl p-5 sm:p-7 text-left shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#d4af37] text-[#180407] flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold tracking-wider text-[#dfc384] uppercase block">
                  Quick Answer • Who is the owner of Nari Pehnawa?
                </span>
                <p className="text-xs sm:text-sm text-white/95 leading-relaxed">
                  <strong>Nari Pehnawa</strong> is exclusively owned and co-founded by <strong>Pooja Verma</strong> and <strong>Ritika Singh</strong>. Headquartered with roots in Uttar Pradesh, the brand is dedicated to connecting authentic Indian weavers directly with women seeking graceful, affordable, and durable ethnic fashion.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#dfc384] font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Prayagraj &amp; Deoria Roots</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" /> 100% Quality Inspected</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Women Led Enterprise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: MEET THE FOUNDERS (DUAL SPOTLIGHT SHOWCASE) ── */}
      <section id="founders" className="py-14 sm:py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
          <span className="text-xs font-bold text-[#c5a880] tracking-widest uppercase block">
            Executive Leadership
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#580C1F]">
            The Driving Force Behind The Brand
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 font-light">
            Bringing together creative fashion sensibilities with honest, customer-centric business values.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          
          {/* ═ FOUNDER 1: POOJA VERMA ═ */}
          <div className="bg-white rounded-3xl border border-[#c5a880]/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-lg">
                    <img
                      src="/pooja-verma.jpg"
                      alt="Pooja Verma - Founder of Nari Pehnawa"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/logo_square.png";
                      }}
                    />
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-[#580C1F] text-[#dfc384] text-[10px] font-bold rounded-full border border-[#dfc384]/40 shadow-sm">
                    Verified
                  </span>
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#c5a880]">
                    <Sparkle className="w-3 h-3 text-[#d4af37]" /> Co-Founder &amp; Creative Director
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#580C1F]">
                    Pooja Verma
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center justify-center sm:justify-start gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> Prayagraj, Uttar Pradesh
                  </p>
                  <p className="text-xs text-zinc-600 pt-1 leading-relaxed">
                    Spearheading fabric innovation, artisan weaving networks, and traditional Chikankari craftsmanship.
                  </p>
                </div>
              </div>

              {/* Quote Block */}
              <div className="relative bg-[#FAF6F0] border-l-4 border-[#d4af37] p-4 sm:p-5 rounded-r-2xl text-xs sm:text-sm text-zinc-800 leading-relaxed font-serif italic shadow-inner">
                <Quote className="w-6 h-6 text-[#d4af37]/30 absolute top-2 right-3 pointer-events-none" />
                "As the Owner of Nari Pehnawa, I focus on delivering superior quality, innovative designs, and effortless comfort. From thoughtfully crafting each design to carefully sourcing fabrics, we prioritize excellence at every stage. Our aim is to make fashion accessible, special, and unique for every woman."
              </div>

              {/* Core Strengths */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Key Responsibilities &amp; Focus
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Handloom &amp; Weave Sourcing
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Contemporary Cuts &amp; Fit
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Artisan Fair-Trade
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Trend Research
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#580C1F] text-[#F7ECE1] px-6 py-3 text-xs font-semibold flex items-center justify-between">
              <span>Vision: Ethnic Luxury for Every Woman</span>
              <span className="text-[#dfc384] font-serif italic">Craftsmanship First</span>
            </div>
          </div>

          {/* ═ FOUNDER 2: RITIKA SINGH ═ */}
          <div className="bg-white rounded-3xl border border-[#c5a880]/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group">
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#d4af37] shadow-lg">
                    <img
                      src="/ritika-singh.png"
                      alt="Ritika Singh - Founder of Nari Pehnawa"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/ritika-singh.jpg";
                      }}
                    />
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-[#580C1F] text-[#dfc384] text-[10px] font-bold rounded-full border border-[#dfc384]/40 shadow-sm">
                    Verified
                  </span>
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-[#c5a880]">
                    <Sparkle className="w-3 h-3 text-[#d4af37]" /> Co-Founder &amp; Managing Director
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#580C1F]">
                    Ritika Singh
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center justify-center sm:justify-start gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> Deoria, Uttar Pradesh
                  </p>
                  <p className="text-xs text-zinc-600 pt-1 leading-relaxed">
                    Directing brand operations, customer trust systems, logistics networks, and honest pricing standards.
                  </p>
                </div>
              </div>

              {/* Quote Block */}
              <div className="relative bg-[#FAF6F0] border-l-4 border-[#d4af37] p-4 sm:p-5 rounded-r-2xl text-xs sm:text-sm text-zinc-800 leading-relaxed font-serif italic shadow-inner">
                <Quote className="w-6 h-6 text-[#d4af37]/30 absolute top-2 right-3 pointer-events-none" />
                "Nari Pehnawa represents every woman who dares to dream big. Coming from Deoria, I envisioned an Indian brand where every customer receives genuine boutique quality without artificial markups, backed by trustworthy customer care and transparent delivery."
              </div>

              {/* Core Strengths */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Key Responsibilities &amp; Focus
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Express Pan-India Delivery
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Transparent Real Pricing
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> 24/7 Customer Satisfaction
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#580C1F]" /> Strict Quality Audit
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#580C1F] text-[#F7ECE1] px-6 py-3 text-xs font-semibold flex items-center justify-between">
              <span>Vision: Uncompromised Trust &amp; Integrity</span>
              <span className="text-[#dfc384] font-serif italic">Customer First</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION: OUR ORIGIN STORY (FROM PRAYAGRAJ & DEORIA TO PAN-INDIA) ── */}
      <section id="story" className="py-14 sm:py-20 bg-white border-y border-[#c5a880]/20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#c5a880] tracking-widest uppercase block">
              The Journey of Two Friends
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#580C1F]">
              How Nari Pehnawa Was Born
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed">
              What began as thoughtful conversations between two ambitious friends from small towns of Uttar Pradesh evolved into one of the most promising women's ethnic wear movements in India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[#FAF6F0] p-6 sm:p-8 rounded-3xl border border-[#c5a880]/25 space-y-3 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-[#580C1F] text-[#dfc384] flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="font-serif text-lg font-bold text-[#580C1F]">
                The Cultural Spark
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-light">
                Growing up in Prayagraj and Deoria, Pooja and Ritika noticed a recurring problem: market ethnic wear was either overpriced designer fashion or low-quality fast garments that tore after two washes. They resolved to fix this.
              </p>
            </div>

            <div className="bg-[#FAF6F0] p-6 sm:p-8 rounded-3xl border border-[#c5a880]/25 space-y-3 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-[#580C1F] text-[#dfc384] flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="font-serif text-lg font-bold text-[#580C1F]">
                Direct Weaver Alliances
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-light">
                Instead of buying through wholesale layers, they traveled directly to master handloom weavers in Varanasi, Lucknow, and Rajasthan, ensuring fair wages to craftsmen and honest factory-direct pricing for consumers.
              </p>
            </div>

            <div className="bg-[#FAF6F0] p-6 sm:p-8 rounded-3xl border border-[#c5a880]/25 space-y-3 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-[#580C1F] text-[#dfc384] flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="font-serif text-lg font-bold text-[#580C1F]">
                Women Self-Reliance
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-light">
                Today, Nari Pehnawa stands as a symbol of independent women entrepreneurship. Every package shipped is a testament to perseverance, quality fabrics, and heartfelt Indian pride.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: 4 BRAND PILLARS & TRUST COMMITMENTS ── */}
      <section className="py-14 sm:py-20 max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-[#c5a880] tracking-widest uppercase block">
            Our Promise to You
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#580C1F]">
            The 4 Nari Pehnawa Guarantees
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-[#c5a880]/25 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#580C1F]/10 text-[#580C1F] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-[#580C1F]">100% Authentic Fabric</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Pure georgettes, breathable cottons, rich chanderis, and pure mulmul fabrics tested for longevity.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c5a880]/25 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#580C1F]/10 text-[#580C1F] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-[#580C1F]">Zero Filter Real Photos</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              We photograph actual production samples under natural lighting so what you see is exactly what arrives.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c5a880]/25 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#580C1F]/10 text-[#580C1F] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-[#580C1F]">Direct Artisan Pricing</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              By eliminating distributor markups, our customers save 40% to 60% compared to luxury boutique rates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#c5a880]/25 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#580C1F]/10 text-[#580C1F] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-bold text-[#580C1F]">Founder-Backed Service</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Every complaint and query is overseen with a customer-first policy, easy exchange, and secure payments.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION: FREQUENTLY ASKED QUESTIONS (SEO KNOWLEDGE ACCORDION) ── */}
      <section id="faq" className="py-14 sm:py-20 bg-white border-t border-[#c5a880]/20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5a880] tracking-widest uppercase">
              <HelpCircle className="w-4 h-4 text-[#d4af37]" /> Common Questions &amp; Answers
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#580C1F]">
              Frequently Asked Questions About Nari Pehnawa &amp; Owners
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600">
              Clear facts and details regarding ownership, authenticity, and our brand philosophy.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#c5a880]/30 bg-[#FAF6F0] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-serif font-bold text-sm sm:text-base text-[#580C1F] hover:text-[#3e0815] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#c5a880] flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#580C1F]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-700 leading-relaxed font-light border-t border-[#c5a880]/15 pt-3">
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
      <section className="py-16 sm:py-24 bg-[#180407] text-[#F7ECE1] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-[#580C1F] to-black" />

        <div className="relative z-10 max-w-[850px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <Quote className="w-12 h-12 text-[#dfc384]/30 mx-auto" />
          
          <span className="text-xs font-bold text-[#dfc384] tracking-widest uppercase block">
            A Letter from the Founders
          </span>

          <blockquote className="font-serif text-lg sm:text-2xl text-white/95 font-medium italic leading-relaxed">
            "When you order from Nari Pehnawa, you aren't just purchasing a piece of clothing — you are becoming a valued part of our dream. We pour our hearts into every stitch, every design, and every package. We promise to always uphold your trust with honesty, grace, and exquisite ethnic craftsmanship."
          </blockquote>

          <div className="pt-4 space-y-1">
            <h4 className="font-bold text-[#dfc384] tracking-widest text-base sm:text-lg">
              — Pooja Verma &amp; Ritika Singh
            </h4>
            <p className="text-xs text-[#F7ECE1]/70 tracking-wider uppercase font-light">
              Founders &amp; Owners, Nari Pehnawa
            </p>
          </div>

          <div className="pt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#d4af37] hover:bg-[#c49d2f] text-[#180407] font-bold text-sm rounded-full shadow-lg transition duration-200"
            >
              <span>Explore The Latest Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXECUTIVE FOOTER ── */}
      <footer className="bg-[#100204] text-[#F7ECE1]/75 border-t border-[#580C1F]/40 py-10 px-4 sm:px-6">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left text-xs">
          <div className="space-y-1">
            <span className="font-serif text-base font-bold text-white tracking-widest block">
              NARI PEHNAWA
            </span>
            <p className="text-[11px] text-zinc-400">
              Official Founders &amp; Ownership Portal • Founded by Pooja Verma &amp; Ritika Singh
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 font-semibold text-zinc-300">
            <Link to="/" className="hover:text-[#dfc384] transition">Home</Link>
            <Link to="/new-arrivals" className="hover:text-[#dfc384] transition">New Arrivals</Link>
            <Link to="/category/sale" className="hover:text-[#dfc384] transition">Sale</Link>
            <Link to="/support/contact-us" className="hover:text-[#dfc384] transition">Contact Us</Link>
          </div>

          <div className="text-[11px] text-zinc-500">
            © 2026 Nari Pehnawa. All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default OwnerPage;
