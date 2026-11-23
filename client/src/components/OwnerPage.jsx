import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  Quote,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  MapPin,
  GraduationCap,
  Award,
  Heart,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Scale,
  PackageCheck,
  Scissors,
  Check
} from "lucide-react";
import { resolveImageUrl } from "../utils/imageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const DEFAULT_OWNER_DATA = {
  name: "Pooja Verma",
  role: "Founder",
  tagline: "Timeless Indian Heritage • Handcrafted Luxury Ethnic Wear",
  quote: "My dream has always been to bring the royal elegance of authentic Indian handlooms into everyday life — handcrafted for women, by women, with uncompromised fabric purity, honest pricing, and genuine trust.",
  image: "/pooja-verma.jpg",
  origin: "Deoria & Sultanpur, Uttar Pradesh (Traditional Purvanchal Handloom & Artisan Heartland)",
  education: "Bachelor of Arts (B.A.) • Rishi Raj Mahavidyalaya, Katka, Sultanpur (Dr. Ram Manohar Lohia Avadh University, RMLAU)",
  craft_expertise: "Direct Artisan Loom Sourcing, 100% Breathable Pure Cotton & Thread Count Density Testing",
  core_mission: "Women Self-Reliance, Fair Artisan Livelihoods & Heirloom Handcrafted Luxury at Honest Pricing",
  story_title: "The Journey of Nari Pehnawa",
  story_subtitle: "From Generational Weaving Looms to Wardrobes Across India",
  story_paragraphs: [
    "Nari Pehnawa was born out of a profound dream: to bring genuine, royal Indian ethnic wear into everyday wardrobes with uncompromising authenticity, pure fabric comfort, and honest pricing. Founded by Pooja Verma, the brand represents woman-led entrepreneurship rooted firmly in the rich cultural soil of Purvanchal, Uttar Pradesh.",
    "Having grown up in Deoria and completed her Bachelor of Arts from Rishi Raj Mahavidyalaya, Katka, Sultanpur (affiliated to Dr. Ram Manohar Lohia Avadh University - RMLAU), Pooja observed a critical dilemma in the ethnic wear space. Commercial fast-fashion was flooding wardrobes with synthetic polyester blends and rigid fits, while high-end designer boutiques charged exorbitant prices that ordinary families could not afford.",
    "Refusing to accept compromises on comfort and authenticity, Pooja journeyed directly to traditional handloom artisan clusters across Uttar Pradesh. Working closely alongside generational master weavers and tailors, she personally inspected yarn densities, thread counts, vegetable dye stability, and reinforced lock-stitch seams to ensure lasting durability and effortless drape.",
    "What started as a passionate mission has grown into a beloved ethnic label trusted by women nationwide. Today, Nari Pehnawa connects skilled rural artisans directly to modern households, ensuring fair livelihoods for craft families and heirloom-grade ethnic wear for every customer.",
    "Every single kurti, suit set, and handcrafted ensemble carries Pooja's personal seal of quality, honest pricing, and genuine devotion to Indian handloom pride."
  ],
  trust_title: "The Pillars of Uncompromising Trust",
  trust_subtitle: "Every thread, every silhouette, and every promise backed by our personal founder commitment.",
  trust_items: [
    {
      title: "100% Pure Breathable Fabric Guarantee",
      desc: "Hand-tested for breathability, pure cotton density, and color-fastness with zero skin-irritating synthetics. Fabrics crafted to breathe with you all day long."
    },
    {
      title: "Direct-From-Loom Fair Honest Pricing",
      desc: "We completely eliminate middleman broker markups. Every single rupee goes directly into artisan craft density and premium fabric quality."
    },
    {
      title: "Generous 2-3 Inch Tailored Alteration Margins",
      desc: "Every ensemble features generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian women's body silhouettes."
    },
    {
      title: "Transparent Doorstep Experience",
      desc: "Real product photographs with no deceptive lighting or filters, honest fabric weight disclosures, and dedicated founder-backed customer support."
    },
    {
      title: "Fair Artisan Wages & Women Empowerment",
      desc: "Providing sustainable year-round employment to rural women tailors and multigenerational handloom artisan families across Uttar Pradesh."
    }
  ],
  vision_title: "Our Guiding Promise",
  vision_quote: "To deliver heirloom-grade, breathable, and regal Indian ethnic wear into every household — straight from artisan looms with complete transparency and fair pricing.",
  brand_values: [
    {
      title: "Direct Loom Sourcing",
      desc: "Hand-selecting fabrics directly from artisan clusters across Uttar Pradesh to ensure pure cotton breathability, vivid natural dyes, and heirloom texture."
    },
    {
      title: "True Indian Fit Margins",
      desc: "Generous 2-3 inch inner margins and tailored armholes designed specifically for real Indian body contours, ensuring freedom of movement and graceful drape."
    },
    {
      title: "Accessible Luxury",
      desc: "Eliminating multi-tier distributor markups so that authentic royal craftsmanship remains within honest, transparent reach."
    },
    {
      title: "Artisan Empowerment",
      desc: "Partnering directly with local women tailors and multigenerational artisan families, celebrating sustainable Indian handcraft."
    }
  ]
};

const TRUST_ICONS = [
  ShieldCheck,
  Scale,
  Sparkles,
  PackageCheck,
  HeartHandshake
];

const PROCESS_STEPS = [
  {
    step: "01",
    phase: "Cluster Sourcing",
    title: "Direct Loom Sourcing",
    desc: "Traveling directly to weaving hubs across Uttar Pradesh, hand-selecting high-grade cotton and silk fibers from generational artisans."
  },
  {
    step: "02",
    phase: "Quality Testing",
    title: "Pure Fabric & Density Verification",
    desc: "Rigorous yarn count, color fastness, and breathability checks to guarantee skin-friendly, long-lasting comfort with zero synthetic itch."
  },
  {
    step: "03",
    phase: "Master Tailoring",
    title: "True Indian Fit Construction",
    desc: "Crafted with generous 2-3 inch inner alteration margins and tailored armholes, ensuring effortless drape for real women's bodies."
  },
  {
    step: "04",
    phase: "Ethical Delivery",
    title: "Transparent Doorstep Luxury",
    desc: "Packaged securely with honest fabric disclosures and shipped directly to your wardrobe with fair compensation returned to weavers."
  }
];

const OwnerPage = () => {
  const [owner, setOwner] = useState(DEFAULT_OWNER_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchOwner = async () => {
      try {
        const res = await fetch(`${API_BASE}/owner/?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            setOwner((prev) => ({
              ...prev,
              ...data,
              role: data.role || prev.role || "Founder",
              trust_title:
                data.trust_title && data.trust_title.replace(/[^\x00-\x7F]/g, "").trim().length > 3
                  ? data.trust_title.replace(/[^\x00-\x7F]/g, "").replace(/\|\s*$/, "").trim()
                  : "The Pillars of Uncompromising Trust",
              tagline:
                data.tagline && !data.tagline.includes("Tadka")
                  ? data.tagline
                  : "Timeless Indian Heritage • Handcrafted Luxury Ethnic Wear",
              story_paragraphs:
                Array.isArray(data.story_paragraphs) && data.story_paragraphs.length > 0
                  ? data.story_paragraphs
                  : prev.story_paragraphs,
              trust_items:
                Array.isArray(data.trust_items) && data.trust_items.length > 0
                  ? data.trust_items
                  : prev.trust_items,
              brand_values:
                Array.isArray(data.brand_values) && data.brand_values.length > 0
                  ? data.brand_values
                  : prev.brand_values
            }));
          }
        }
      } catch (err) {
        console.warn("Could not fetch owner profile from API, using default data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwner();

    const pageTitle = `Meet The Founder | Pooja Verma — Nari Pehnawa`;
    document.title = pageTitle;

    const metaTags = {
      description:
        "Meet Pooja Verma, the Founder behind Nari Pehnawa. Discover her journey of women self-reliance, authentic handloom heritage, pure breathable fabrics, and transparent ethnic fashion.",
      keywords:
        "Nari Pehnawa, Nari Pehnawa Founder, Pooja Verma, Women Entrepreneurship, Indian Ethnic Wear, Handloom Heritage, Authentic Kurtis, Handcrafted Fashion India, Purvanchal Handlooms",
      "og:title": pageTitle,
      "og:description":
        "Discover the inspiring journey of Pooja Verma, Founder of Nari Pehnawa — authentic handloom fashion directly from artisan looms.",
      "og:image": "https://www.naripehnawa.com/pooja-verma.jpg",
      "og:url": "https://www.naripehnawa.com/owner",
      "og:type": "profile",
      "og:site_name": "Nari Pehnawa",
      "twitter:card": "summary_large_image",
      "twitter:title": pageTitle,
      "twitter:description":
        "Discover the inspiring journey of Pooja Verma, Founder of Nari Pehnawa — authentic handloom fashion directly from artisan looms.",
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
      elementsToCleanup.forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, []);

  const ownerImg = resolveImageUrl(owner.image, "/pooja-verma.jpg");

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#FAF7F2] text-gray-900 font-sans selection:bg-[#780016] selection:text-white">

      {/* ── LUXURY MINIMALIST HEADER ── */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFC8]/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-[0.2em] text-[#780016] hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#C59B27] flex-shrink-0" />
            <span>NARI PEHNAWA</span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-8">
            <Link
              to="/"
              className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-700 hover:text-[#780016] transition-colors hidden sm:inline-block"
            >
              Home
            </Link>
            <Link
              to="/new-arrivals"
              className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-700 hover:text-[#780016] transition-colors hidden sm:inline-block"
            >
              Collections
            </Link>
            <Link
              to="/new-arrivals"
              className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#780016] hover:bg-[#5A0010] text-white transition-all shadow-sm"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMB ── */}
      <nav aria-label="Breadcrumb" className="w-full bg-[#FAF7F2] border-b border-[#E8DFC8]/40">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#780016] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-[#780016] font-semibold">{owner.name} — {owner.role}</span>
        </div>
      </nav>

      <main className="flex-grow w-full">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: HERO COVER BANNER (DARK ROYAL BURGUNDY WITH GOLD ACCENTS)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full bg-gradient-to-b from-[#160205] via-[#240308] to-[#140105] text-white py-14 sm:py-20 lg:py-24 px-4 sm:px-8 text-center relative overflow-hidden">
          <div className="w-full max-w-4xl mx-auto space-y-4 relative z-10">
            <div className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-[#C59B27]">
              The Heart &amp; Heritage of Nari Pehnawa
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Meet The <span className="text-[#E5B842] italic font-serif">{owner.role || "Founder"}</span>
            </h1>

            <p className="font-serif text-sm sm:text-base lg:text-lg text-amber-100/90 font-light max-w-2xl mx-auto leading-relaxed pt-1">
              {owner.tagline}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#C59B27]" />
              <Crown className="w-4 h-4 text-[#C59B27]" />
              <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#C59B27]" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: FOUNDER EDITORIAL SPREAD & DOSSIER (WARM LINEN CANVAS)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-14 sm:py-18 lg:py-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto bg-[#FDFBF7]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-start">
            
            {/* PORTRAIT PRESENTATION: Responsive Framing on Mobile & Desktop */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-none">
                
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-900 shadow-2xl border border-[#C59B27]/40 ring-1 ring-[#C59B27]/25 ring-offset-4 ring-offset-[#FDFBF7]">
                  <img
                    src={ownerImg}
                    alt={`${owner.name} - ${owner.role}`}
                    className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-102"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.triedFallback) {
                        e.currentTarget.dataset.triedFallback = "true";
                        e.currentTarget.src = "/pooja-verma.jpg";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Elegant Name Plaque on Image */}
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide drop-shadow-md">
                      {owner.name}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-[#E5B842] font-semibold drop-shadow-sm">
                      {owner.role}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* FOUNDER ESSAY & CREDENTIALS: Pure Clean Typography, Zero Cluttered Cards */}
            <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8">
              
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#780016]">
                  {owner.role || "Founder"}
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F0206] tracking-tight leading-tight">
                  {owner.name}
                </h2>
                <p className="font-serif text-sm sm:text-base lg:text-lg italic text-[#780016]">
                  The Visionary Behind Handcrafted Indian Elegance
                </p>
              </div>

              {/* Personal Quote / My Dream - Editorial Border Accent */}
              <div className="relative pl-5 sm:pl-6 border-l-2 border-[#C59B27] py-1.5">
                <Quote className="w-6 h-6 text-[#C59B27]/40 mb-1" />
                <p className="font-serif text-base sm:text-lg lg:text-xl text-gray-800 italic leading-relaxed font-normal">
                  "{owner.quote}"
                </p>
                <span className="block text-xs font-bold text-[#780016] uppercase tracking-[0.2em] mt-3">
                  — {owner.name}, {owner.role}
                </span>
              </div>

              {/* Clean Editorial Dossier Lines — Pure Minimalist Specification Layout */}
              <div className="border-y border-[#E8DFC8] divide-y divide-[#E8DFC8]/80 py-1">
                {owner.origin && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-44 flex-shrink-0 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Roots &amp; Heritage</span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 leading-normal">
                      {owner.origin}
                    </span>
                  </div>
                )}

                {owner.education && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-44 flex-shrink-0 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Education</span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 leading-normal">
                      {owner.education}
                    </span>
                  </div>
                )}

                {owner.craft_expertise && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-44 flex-shrink-0 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Craft Expertise</span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 leading-normal">
                      {owner.craft_expertise}
                    </span>
                  </div>
                )}

                {owner.core_mission && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#780016] sm:w-44 flex-shrink-0 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Core Mission</span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 leading-normal">
                      {owner.core_mission}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: THE STORY OF NARI PEHNAWA (CRISP EDITORIAL WHITE CANVAS)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 sm:py-20 lg:py-24 bg-white border-y border-[#E8DFC8]/70">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-8">
            
            <div className="text-center space-y-2 mb-10 sm:mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#780016]">
                Our Heritage &amp; Journey
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                {owner.story_title}
              </h3>
              {owner.story_subtitle && (
                <p className="font-serif text-sm sm:text-base italic text-[#780016] pt-1">
                  {owner.story_subtitle}
                </p>
              )}
              <div className="w-16 h-0.5 bg-[#C59B27] mx-auto mt-3" />
            </div>

            {/* Continuous Article Narrative with Drop-Cap on First Paragraph */}
            <div className="space-y-6 text-sm sm:text-base text-gray-800 leading-relaxed font-normal">
              {owner.story_paragraphs.map((para, idx) => {
                if (!para || !para.trim()) return null;

                if (idx === 0) {
                  const firstLetter = para.charAt(0);
                  const restOfPara = para.slice(1);
                  return (
                    <p key={idx} className="first-letter:font-serif first-letter:text-5xl sm:first-letter:text-6xl first-letter:font-bold first-letter:text-[#780016] first-letter:mr-3 first-letter:float-left first-letter:leading-none text-justify sm:text-left">
                      {firstLetter}{restOfPara}
                    </p>
                  );
                }

                return (
                  <p key={idx} className="text-justify sm:text-left">
                    {para}
                  </p>
                );
              })}

              {/* Vision Statement Callout */}
              {owner.vision_quote && (
                <div className="mt-8 pt-6 border-t border-[#E8DFC8] pl-5 sm:pl-6 border-l-2 border-[#C59B27]">
                  <span className="text-xs uppercase tracking-widest font-bold text-[#780016] block mb-1">
                    {owner.vision_title || "The Guiding Promise"}
                  </span>
                  <p className="font-serif text-base sm:text-lg font-medium text-gray-900 italic leading-relaxed">
                    "{owner.vision_quote}"
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4: THE PILLARS OF TRUST (DISTINCT DARK ROYAL VELVET BACKGROUND)
        ══════════════════════════════════════════════════════════════════ */}
        {Array.isArray(owner.trust_items) && owner.trust_items.length > 0 && (
          <section className="w-full py-16 sm:py-20 lg:py-24 bg-[#180307] text-white border-b border-[#C59B27]/30">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              
              <div className="text-center space-y-2 mb-12 sm:mb-16">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#E5B842]">
                  <ShieldCheck className="w-4 h-4 text-[#E5B842]" />
                  <span>Founder's Personal Pledge</span>
                </div>
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  {owner.trust_title || "The Pillars of Uncompromising Trust"}
                </h3>
                {owner.trust_subtitle && (
                  <p className="font-serif text-sm sm:text-base italic text-amber-100/80 max-w-2xl mx-auto pt-1 font-light">
                    {owner.trust_subtitle}
                  </p>
                )}
                <div className="w-16 h-0.5 bg-[#C59B27] mx-auto mt-3" />
              </div>

              {/* Distinctive Dark Gold-Accented Trust Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {owner.trust_items.map((item, idx) => {
                  const IconComponent = TRUST_ICONS[idx % TRUST_ICONS.length] || ShieldCheck;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col space-y-3 p-6 rounded-2xl bg-white/[0.04] border border-[#C59B27]/25 hover:border-[#C59B27]/60 hover:bg-white/[0.07] transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C59B27]/15 flex items-center justify-center text-[#E5B842]">
                          <IconComponent className="w-5 h-5 text-[#E5B842]" />
                        </div>
                        <span className="font-serif text-xs font-bold uppercase tracking-widest text-[#E5B842]">
                          Guarantee 0{idx + 1}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Trust Reassurance Footnote */}
              <div className="mt-12 pt-8 border-t border-white/10 text-center">
                <p className="text-xs sm:text-sm text-stone-400 max-w-2xl mx-auto leading-relaxed">
                  Every order placed on <strong className="text-[#E5B842] font-semibold">Nari Pehnawa</strong> is individually inspected to founder Pooja Verma's standards before dispatch. We take direct personal accountability for your satisfaction.
                </p>
              </div>

            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5: THE ARTISAN CRAFT PROCESS (WARM SANDSTONE STEP PROGRESSION)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 sm:py-20 lg:py-24 bg-[#F4EFEB] border-b border-[#E8DFC8]">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            
            <div className="text-center space-y-2 mb-12 sm:mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#780016]">
                Transparent Artisanship
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                The Artisan Making Process
              </h3>
              <p className="font-serif text-sm sm:text-base italic text-[#780016] max-w-2xl mx-auto pt-1">
                A transparent glimpse into how every handcrafted Nari Pehnawa silhouette comes to life.
              </p>
              <div className="w-16 h-0.5 bg-[#C59B27] mx-auto mt-3" />
            </div>

            {/* Sequential 4-Step Craft Progression */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {PROCESS_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-col space-y-3 p-6 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#C59B27]">
                      {step.step}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#780016] px-2.5 py-0.5 rounded-full bg-[#780016]/10">
                      {step.phase}
                    </span>
                  </div>

                  <h4 className="font-serif text-base sm:text-lg font-bold text-gray-900 leading-snug pt-1">
                    {step.title}
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6: FOUNDER INVITATION NOTE & CTA (RICH WINE GRADIENT BANNER)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-[#200308] via-[#2D040C] to-[#200308] text-white text-center px-4 sm:px-8">
          <div className="w-full max-w-3xl mx-auto space-y-6">
            <Quote className="w-10 h-10 text-[#C59B27]/60 mx-auto" />

            <div className="text-xs sm:text-sm uppercase tracking-[0.3em] text-[#E5B842] font-semibold">
              A Personal Note From The Founder
            </div>

            <p className="font-serif text-base sm:text-xl lg:text-2xl text-amber-50/95 italic leading-relaxed font-light">
              "When you wear a Nari Pehnawa piece, you are not just wearing clothing; you are honoring the sacred hands of rural Indian weavers and carrying forward our generational heritage with pure pride."
            </p>

            <div className="space-y-1 pt-2">
              <h4 className="font-serif font-bold text-[#E5B842] text-xl sm:text-2xl tracking-wide">
                — {owner.name}
              </h4>
              <p className="text-xs text-stone-300 uppercase tracking-widest font-medium">
                {owner.role}, Nari Pehnawa
              </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/new-arrivals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C59B27] to-[#A47F1D] text-[#1F0206] font-bold text-xs sm:text-sm tracking-wider uppercase hover:opacity-95 transition shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-[#1F0206]" />
                <span>Shop The Handcrafted Collection</span>
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-sm"
              >
                <span>Back To Home</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── LUXURY STANDALONE FOOTER ── */}
      <footer className="w-full bg-[#0D0103] text-gray-400 border-t border-[#C59B27]/20 py-10 px-4 sm:px-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-3 gap-6 items-center text-center md:text-left text-xs">
          <div className="space-y-1.5">
            <h4 className="font-serif text-lg font-bold text-white tracking-[0.2em]">NARI PEHNAWA</h4>
            <p className="text-gray-400 max-w-sm mx-auto md:mx-0">
              Founded by {owner.name} • Authentic Indian handlooms, breathable cotton kurtis, and royal festive wear delivered with pride nationwide.
            </p>
          </div>

          <div className="flex justify-center gap-6 sm:gap-8 font-semibold text-gray-300">
            <Link to="/" className="hover:text-[#E5B842] transition">Home</Link>
            <Link to="/new-arrivals" className="hover:text-[#E5B842] transition">New Arrivals</Link>
            <Link to="/category/sale" className="hover:text-[#E5B842] transition">Sale</Link>
            <Link to="/owner" className="hover:text-[#E5B842] transition">Founder Story</Link>
          </div>

          <div className="md:text-right text-gray-400 space-y-1">
            <p>&copy; {new Date().getFullYear()} Nari Pehnawa. All Rights Reserved.</p>
            <p className="text-[11px] text-gray-500">Timeless Indian Heritage • Handcrafted with devotion in Uttar Pradesh.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default OwnerPage;
