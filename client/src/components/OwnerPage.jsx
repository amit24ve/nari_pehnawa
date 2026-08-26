import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { SectionHeading } from "./NariHeadingDecoration";
import {
  Award,
  ShieldCheck,
  Truck,
  RotateCcw,
  HeartHandshake,
  Users,
  CheckCircle2,
  Quote,
  Globe,
  Building,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  BookOpen,
  Heart,
  ChevronRight,
  ArrowRight,
  Sparkle,
  Compass
} from "lucide-react";

const OwnerPage = () => {
  useEffect(() => {
    // 1. Save old SEO elements
    const oldTitle = document.title;

    // Set dynamic Page Title
    document.title = "About Us & Founders | Nari Pehnawa - Pooja Verma & Ritika Singh";

    // Define SEO Meta tags to inject/update
    const metaTags = {
      description: "Meet Pooja Verma & Ritika Singh, the co-founders and owners of Nari Pehnawa. Discover the beautiful story of two friends who started this emerging women's Ethnic Wear brand to deliver stylish and comfortable fashion.",
      keywords: "Nari Pehnawa, Nari Pehnawa Founder, Nari Pehnawa Owner, Pooja Verma, Ritika Singh, Pooja Verma Nari Pehnawa, Ritika Singh Nari Pehnawa, About Us Nari Pehnawa, Women's Ethnic Wear, Affordable Fashion India, Women Self-reliance, Prayagraj, Deoria",
      // Open Graph Tags
      "og:title": "About Us & Founders | Nari Pehnawa - Pooja Verma & Ritika Singh",
      "og:description": "Nari Pehnawa is not just a clothing brand, but a beautiful story of the dreams, hard work, and self-reliance of two friends Pooja Verma and Ritika Singh.",
      "og:image": "https://www.naripehnawa.com/motivational-hero.png",
      "og:url": "https://www.naripehnawa.com/owner",
      "og:type": "profile",
      "og:site_name": "Nari Pehnawa",
      // Twitter Card Tags
      "twitter:card": "summary_large_image",
      "twitter:title": "About Us & Founders | Nari Pehnawa - Pooja Verma & Ritika Singh",
      "twitter:description": "Discover the story of Pooja Verma & Ritika Singh, two friends building Nari Pehnawa with dedication.",
      "twitter:image": "https://www.naripehnawa.com/motivational-hero.png",
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
    canonicalLink.setAttribute("href", "https://www.naripehnawa.com/owner");

    // Dynamic JSON-LD Schema.org structured data (Organization, Person, Founder, AboutPage, Breadcrumb)
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://www.naripehnawa.com/#organization",
          "name": "Nari Pehnawa",
          "url": "https://www.naripehnawa.com",
          "logo": {
            "@type": "ImageObject",
            "@id": "https://www.naripehnawa.com/#logo",
            "url": "https://www.naripehnawa.com/logo.png",
            "caption": "Nari Pehnawa Logo"
          },
          "image": {
            "@id": "https://www.naripehnawa.com/#logo"
          },
          "description": "Nari Pehnawa is an emerging women's Ethnic Wear brand co-founded by Pooja Verma and Ritika Singh, dedicated to delivering stylish and comfortable fashion to every woman.",
          "foundingDate": "2024",
          "sameAs": [
            "https://www.facebook.com/naripehnawa",
            "https://www.instagram.com/naripehnawa"
          ],
          "founder": [
            {
              "@id": "https://www.naripehnawa.com/#pooja_verma"
            },
            {
              "@id": "https://www.naripehnawa.com/#ritika_singh"
            }
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
          "@id": "https://www.naripehnawa.com/#pooja_verma",
          "name": "Pooja Verma",
          "jobTitle": "Co-Founder",
          "worksFor": {
            "@id": "https://www.naripehnawa.com/#organization"
          },
          "gender": "Female",
          "birthPlace": {
            "@type": "Place",
            "name": "Deoria, Uttar Pradesh, India"
          },
          "nationality": {
            "@type": "Country",
            "name": "India"
          },
          "description": "Pooja Verma is the Co-Founder and owner of Nari Pehnawa. Her childhood dream has been to create her own identity and stand on her own feet.",
          "image": "https://www.naripehnawa.com/pooja-verma.jpg",
          "sameAs": [
            "https://www.naripehnawa.com/owner"
          ]
        },
        {
          "@type": "Person",
          "@id": "https://www.naripehnawa.com/#ritika_singh",
          "name": "Ritika Singh",
          "jobTitle": "Co-Founder",
          "worksFor": {
            "@id": "https://www.naripehnawa.com/#organization"
          },
          "gender": "Female",
          "birthPlace": {
            "@type": "Place",
            "name": "Prayagraj, Uttar Pradesh, India"
          },
          "alumniOf": {
            "@type": "EducationalOrganization",
            "name": "University of Allahabad"
          },
          "nationality": {
            "@type": "Country",
            "name": "India"
          },
          "description": "Ritika Singh is the Co-Founder and owner of Nari Pehnawa. Her vision is to make Nari Pehnawa a trusted brand through customer satisfaction and quality products.",
          "image": "https://www.naripehnawa.com/ritika-singh.jpg",
          "sameAs": [
            "https://www.naripehnawa.com/owner"
          ]
        },
        {
          "@type": "AboutPage",
          "@id": "https://www.naripehnawa.com/owner#webpage",
          "url": "https://www.naripehnawa.com/owner",
          "name": "About Us & Founders - Nari Pehnawa",
          "description": "Discover the story of Nari Pehnawa, a brand started by Pooja Verma and Ritika Singh to provide stylish, comfortable, and affordable women's ethnic wear.",
          "about": {
            "@id": "https://www.naripehnawa.com/#organization"
          },
          "mainEntity": [
            {
              "@id": "https://www.naripehnawa.com/#pooja_verma"
            },
            {
              "@id": "https://www.naripehnawa.com/#ritika_singh"
            }
          ]
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://www.naripehnawa.com/owner#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.naripehnawa.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "About Us & Founders",
              "item": "https://www.naripehnawa.com/owner"
            }
          ]
        }
      ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    // Scroll to top on mount
    window.scrollTo(0, 0);

    // Cleanup on unmount
    return () => {
      document.title = oldTitle;
      elementsToCleanup.forEach((el) => el.remove());
      if (createdCanonical) {
        canonicalLink.remove();
      } else if (oldCanonicalHref) {
        canonicalLink.setAttribute("href", oldCanonicalHref);
      } else {
        canonicalLink.removeAttribute("href");
      }
      script.remove();
    };
  }, []);

  return (
    <div className="bg-[#FAF6F0] dark:bg-[#120202] text-[#2E0F15] dark:text-[#F7ECE1] transition-colors duration-300 font-sans overflow-x-hidden min-h-screen flex flex-col justify-between">

      {/* ── STICKY GLASSMORPHISM HEADER (WINE & GOLD ACCENTS) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF6F0]/90 dark:bg-[#120202]/90 backdrop-blur-lg border-b border-[#c5a880]/30 dark:border-[#580C1F]/30 transition-all duration-300">
        <div className="max-w-[1200px] mx-auto px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="font-serif text-sm xs:text-base sm:text-2xl font-bold tracking-widest text-[#580C1F] dark:text-[#d4af37] hover:opacity-85 transition-opacity flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
          >
            <Sparkle className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] animate-spin-slow flex-shrink-0" />
            NARI PEHNAWA
          </Link>

          <div className="flex items-center gap-2 sm:gap-6">
            <Link
              to="/"
              className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-zinc-700 hover:text-[#580C1F] dark:text-zinc-300 dark:hover:text-[#d4af37] transition-colors hidden sm:block"
            >
              Home
            </Link>
            <Link
              to="/new-arrivals"
              className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-zinc-700 hover:text-[#580C1F] dark:text-zinc-300 dark:hover:text-[#d4af37] transition-colors hidden sm:block"
            >
              New Arrivals
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold bg-[#580C1F] hover:bg-[#3D0814] text-white transition-all shadow-md shadow-[#580C1F]/10 hover:shadow-lg whitespace-nowrap"
            >
              Back To Store
              <span className="hidden xs:inline"><ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content wrapper */}
      <main className="flex-grow pt-[56px] sm:pt-[78px]">

        {/* ── HERO BANNER ── */}
        <section className="relative h-[340px] xs:h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out hover:scale-105"
            style={{ backgroundImage: `url('/motivational-hero.png')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120202] via-[#120202]/50 to-black/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B0606]/90 via-black/30 to-[#120202]/80" />

          {/* Golden lighting accents */}
          <div className="absolute top-1/4 left-1/4 w-36 h-36 sm:w-96 sm:h-96 bg-[#d4af37]/15 rounded-full filter blur-[50px] sm:blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-36 h-36 sm:w-96 sm:h-96 bg-[#580C1F]/20 rounded-full filter blur-[50px] sm:blur-[120px] pointer-events-none" />

          <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto space-y-3 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-zinc-900/40 border border-white/20 backdrop-blur-md text-[#dfc384] text-[9px] sm:text-xs md:text-sm font-bold uppercase tracking-widest shadow-xl">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37] animate-pulse flex-shrink-0" />
              Empowering Self-Reliance
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              Meet The <span className="text-[#d4af37] font-light italic font-serif">Founders</span>
            </h1>

            <p className="text-xs sm:text-lg md:text-xl text-[#F7ECE1] font-light max-w-2xl mx-auto leading-relaxed opacity-90">
              The inspirational journey, dreams, and dedication behind the creation of Nari Pehnawa.
            </p>

            <div className="flex justify-center pt-2">
              <div className="w-16 h-1 sm:w-28 sm:h-1.5 bg-gradient-to-r from-[#d4af37] via-[#dfc384] to-[#580C1F] rounded-full" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-24 bg-gradient-to-t from-[#FAF6F0] dark:from-[#120202] to-transparent pointer-events-none" />
        </section>

        {/* Breadcrumbs */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-1.5 text-xs text-zinc-550 dark:text-zinc-400">
          <Link to="/" className="hover:text-[#580C1F] dark:hover:text-[#d4af37] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          <span className="text-[#580C1F] dark:text-[#dfc384] font-semibold">About Us & Founders</span>
        </div>

        {/* ── SECTION 1: OUR STORY (ABOUT US - IMMERSIVE BANNER) ── */}
        <section className="py-10 sm:py-16 max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="w-full relative bg-[#FDFBF7] dark:bg-[#1B0606]/60 rounded-[36px] border border-[#c5a880]/30 shadow-2xl p-6 sm:p-12 md:p-16 transition-transform duration-500 hover:scale-[1.01] overflow-hidden">

            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#580C1F]/5 rounded-full filter blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center space-y-4 max-w-3xl mx-auto mb-10 sm:mb-14">
              <div className="flex items-center justify-center gap-2">
                <span className="w-6 h-[1.5px] bg-[#d4af37]" />
                <span className="text-[#580C1F] dark:text-[#d4af37] font-bold uppercase tracking-widest text-[10px] sm:text-xs">Section 01 — Our Narrative</span>
                <span className="w-6 h-[1.5px] bg-[#d4af37]" />
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#2E0F15] dark:text-white leading-tight">
                The Journey of <span className="text-[#580C1F] dark:text-[#d4af37] font-light italic font-serif">Nari Pehnawa</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-350 font-serif italic tracking-wide">
                How Pooja Verma & Ritika Singh turned self-reliance and fashion passion into reality.
              </p>
              <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-4" />
            </div>

            {/* Immersive 2-Column Story Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-light leading-relaxed relative z-10">
              <div className="space-y-6">
                <p>
                  <span className="float-left text-5xl font-serif font-bold text-[#580C1F] dark:text-[#d4af37] mr-3 mt-1 line-height-1">N</span>
                  <strong className="text-[#580C1F] dark:text-[#d4af37] font-bold">Nari Pehnawa</strong> is not just a clothing brand, but a beautiful story of the dreams, hard work, and self-reliance of two friends. It is an emerging women's Ethnic Wear brand started by two best friends—<span className="font-semibold text-[#2E0F15] dark:text-white">Pooja Verma</span> and <span className="font-semibold text-[#2E0F15] dark:text-white">Ritika Singh</span>.
                </p>
                <p>
                  Our dream has always been to stand on our own feet and become self-dependent. Although we had never thought of doing business before, our passion for fashion and the desire to provide the best clothes to women on a low budget brought us onto this path. Today, we are working together on this with complete dedication.
                </p>
                <p>
                  Hailing from Deoria and Prayagraj, we stepped out of our comfort zones to build something of our own. With no prior business background, we had to learn every single detail from scratch—from sourcing high-grade cotton and silk in the local markets of Uttar Pradesh to understanding what makes a dress truly comfortable. Every hurdle we crossed made our bond and our brand stronger.
                </p>
              </div>
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <p>
                    Nari Pehnawa is proof that when women support women, magical things happen. It is our dream to prove that traditional values and modern ambitions can coexist beautifully. By working directly with local artisans, we bring you designs that carry the warmth of Indian craftsmanship at a fraction of standard retail prices.
                  </p>
                  <p>
                    Today, when we see a woman smiling in a Nari Pehnawa outfit, it is the biggest reward for our hard work. We want to inspire every young girl sitting in Allahabad, Deoria, or anywhere in India to believe that she, too, can stand on her own feet and create her own destiny.
                  </p>
                </div>

                {/* Brand Mission Quote Callout (Redesigned) */}
                <div className="p-6 rounded-2xl bg-[#580C1F]/5 dark:bg-[#580C1F]/10 border-l-4 border-[#d4af37] shadow-sm mt-4">
                  <span className="text-[#580C1F] dark:text-[#d4af37] text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Our Core Mission</span>
                  <p className="font-serif text-base sm:text-lg font-medium text-[#2E0F15] dark:text-white italic">
                    "To deliver stylish and comfortable fashion to every woman, without compromising on quality."
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 2: CO-FOUNDERS (PROFILES) ── */}
        <section className="py-12 sm:py-20 max-w-[1200px] mx-auto px-4 sm:px-6 border-b border-[#c5a880]/15">
          <div className="max-w-2xl mx-auto mb-12 text-center space-y-2">
            <span className="text-[#580C1F] dark:text-[#d4af37] text-xs font-bold uppercase tracking-widest">Section 02</span>
            <SectionHeading className="text-3xl sm:text-4xl">Meet the Founders</SectionHeading>
            <div className="w-12 h-[2px] bg-[#d4af37] mx-auto mt-2" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
            {/* Card 1: Pooja Verma */}
            <div className="w-full md:w-1/2 flex flex-col items-center bg-white dark:bg-[#1B0606] rounded-3xl border border-[#c5a880]/20 shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1">
              <div className="w-full h-[320px] sm:h-[400px] relative overflow-hidden group">
                <img src="/pooja-verma.jpg" alt="Pooja Verma" className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120202] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold">Pooja Verma</h3>
                  <p className="text-[11px] sm:text-xs text-[#e2d8be] tracking-wider uppercase font-semibold">Co-Founder, Nari Pehnawa</p>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-b border-[#580C1F]/10 dark:border-[#580C1F]/20 pb-4">
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Hometown</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">Deoria, UP</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Education</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">B.A. Graduation (Completed from Sultanpur)</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Age</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">24 Years</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Focus</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">Design & Sourcing</span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-zinc-850 dark:text-zinc-200 leading-relaxed font-light italic pl-3 border-l-2 border-[#d4af37] bg-[#580C1F]/5 py-2 rounded-r-lg">
                  "As the Owner of Nari Pehnava, I focus on delivering superior quality, innovative designs, and effortless comfort. From thoughtfully crafting each design to carefully sourcing fabrics, we prioritize excellence at every stage. Our aim is to make fashion accessible, special, and unique for every woman.."
                </div>
              </div>
            </div>

            {/* Card 2: Ritika Singh */}
            <div className="w-full md:w-1/2 flex flex-col items-center bg-white dark:bg-[#1B0606] rounded-3xl border border-[#c5a880]/20 shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1">
              <div className="w-full h-[320px] sm:h-[400px] relative overflow-hidden group">
                <img src="/ritika-singh.jpg" alt="Ritika Singh" className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120202] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold">Ritika Singh</h3>
                  <p className="text-[11px] sm:text-xs text-[#e2d8be] tracking-wider uppercase font-semibold">Co-Founder, Nari Pehnawa</p>
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-4 w-full">
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-b border-[#580C1F]/10 dark:border-[#580C1F]/20 pb-4">
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Location</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">Prayagraj, UP</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Education</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">B.A. (Pursuing), University of Allahabad</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Age</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">22 Years</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 dark:text-[#dfc384] text-[10px] uppercase font-semibold">Focus</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">Trust & Service</span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-zinc-855 dark:text-zinc-200 leading-relaxed font-light italic pl-3 border-l-2 border-[#d4af37] bg-[#580C1F]/5 py-2 rounded-r-lg">
                  "Managing my studies alongside building Nari Pehnawa has taught me the value of discipline and trust. Sincerity and focus are key to earning a customer's trust, and I strive to deliver exactly that."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: SOURCING & FABRIC CRAFTSMANSHIP (PROCESS FLOW) ── */}
        <section className="py-12 sm:py-20 max-w-[1200px] mx-auto px-4 sm:px-6 border-b border-[#c5a880]/15">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#580C1F] dark:bg-[#d4af37] rounded-full" />
                <span className="text-[#580C1F] dark:text-[#d4af37] font-bold uppercase tracking-widest text-[10px] sm:text-xs">Section 03</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2E0F15] dark:text-white leading-tight">
                Handwoven Tradition, <span className="text-[#580C1F] dark:text-[#d4af37] font-light italic">Modern Craft</span>
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-light">
                Our custom approach to fabric sourcing eliminates poor synthetics and prioritizes pure skin-friendly threads.
              </p>
            </div>

            <div className="w-full lg:w-2/3 space-y-6">
              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#c5a880]/40 space-y-8 py-2">
                <div className="relative group">
                  <div className="absolute -left-[32px] sm:-left-[40px] w-3 h-3 bg-[#d4af37] rounded-full ring-4 ring-[#FAF6F0] dark:ring-[#120202] group-hover:scale-125 transition-transform duration-300" />
                  <h4 className="font-serif text-lg font-bold text-[#2E0F15] dark:text-white transition-colors group-hover:text-[#580C1F] dark:group-hover:text-[#d4af37]">01. Sourcing at the Weaving Hubs</h4>
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 mt-1 font-light leading-relaxed">
                    We travel directly to the weaving markets of Uttar Pradesh and local textile centers to select fabrics. Hand-testing cotton density and dye purity before placing orders.
                  </p>
                </div>
                <div className="relative group">
                  <div className="absolute -left-[32px] sm:-left-[40px] w-3 h-3 bg-[#580C1F] dark:bg-[#d4af37] rounded-full ring-4 ring-[#FAF6F0] dark:ring-[#120202] group-hover:scale-125 transition-transform duration-300" />
                  <h4 className="font-serif text-lg font-bold text-[#2E0F15] dark:text-white transition-colors group-hover:text-[#580C1F] dark:group-hover:text-[#d4af37]">02. Micro-Level Stitching Inspection</h4>
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 mt-1 font-light leading-relaxed">
                    Every kurta-set, suit, and Western coordinate is run through double-lock stitching checks to guarantee it survives standard machine washes and retains fitting shape.
                  </p>
                </div>
                <div className="relative group">
                  <div className="absolute -left-[32px] sm:-left-[40px] w-3 h-3 bg-[#580C1F] dark:bg-[#d4af37] rounded-full ring-4 ring-[#FAF6F0] dark:ring-[#120202] group-hover:scale-125 transition-transform duration-300" />
                  <h4 className="font-serif text-lg font-bold text-[#2E0F15] dark:text-white transition-colors group-hover:text-[#580C1F] dark:group-hover:text-[#d4af37]">03. Honest Sizing & Fit Validation</h4>
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 mt-1 font-light leading-relaxed">
                    Unlike mass-manufactured fast fashion, our sizes are tailored to real Indian body structures, providing comfortable margins and adjustments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: OUR MISSION (NUMBERED LIST) ── */}
        <section className="py-12 sm:py-20 max-w-[1200px] mx-auto px-4 sm:px-6 border-b border-[#c5a880]/15 bg-gradient-to-b from-transparent to-[#FAF6F0]/20 dark:to-[#1B0606]/10">
          <div className="max-w-2xl mx-auto mb-12 text-center space-y-2">
            <span className="text-[#580C1F] dark:text-[#d4af37] text-xs font-bold uppercase tracking-widest">Section 04</span>
            <SectionHeading className="text-3xl sm:text-4xl">Our Mission &amp; Purpose</SectionHeading>
            <div className="w-12 h-[2px] bg-[#d4af37] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
            <div className="flex gap-4">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d4af37] opacity-80">01.</span>
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">Affordable Luxury</h3>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  To eliminate heavy retail markups so premium quality ethnic wear and accessories fit every budget comfortably.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d4af37] opacity-80">02.</span>
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">Complete Dedication</h3>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  Working directly at every level of selection, checking, and packaging to maintain the utmost standard of honesty.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d4af37] opacity-80">03.</span>
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">Self-Reliance</h3>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  Nurturing and inspiring independent mindsets in young Indian girls by providing local livelihood channels.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#d4af37] opacity-80">04.</span>
              <div className="space-y-1">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">Uncompromising Comfort</h3>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  To deliver stylish and comfortable fashion that breathes beautifully and looks radiant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: CURATED ETHNIC CATEGORIES ── */}
        <section className="py-12 sm:py-20 max-w-[1200px] mx-auto px-4 sm:px-6 border-b border-[#c5a880]/15">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-[2px] bg-[#580C1F] dark:bg-[#d4af37] rounded-full" />
                <span className="text-[#580C1F] dark:text-[#d4af37] font-bold uppercase tracking-widest text-[10px] sm:text-xs">Section 05</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2E0F15] dark:text-white leading-tight">
                Our Curated <span className="text-[#580C1F] dark:text-[#d4af37] font-light italic">Ethnic Categories</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 font-light leading-relaxed">
                Pooja & Ritika carefully design and hand-select specific patterns to celebrate Indian tradition while maintaining everyday usability.
              </p>
            </div>

            {/* Curated category grid */}
            <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1B0606] border border-[#c5a880]/20 hover:border-[#580C1F] transition-all duration-300 shadow-md">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#580C1F] dark:text-[#d4af37] mb-2 flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  Elegant Anarkali Sets
                </h4>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  Crafted with flowing, tiered panels that represent heritage grace. We curate fabrics like soft rayon and pure cotton featuring delicate zari work, making them perfect for festivals and special occasions.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1B0606] border border-[#c5a880]/20 hover:border-[#580C1F] transition-all duration-300 shadow-md">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#580C1F] dark:text-[#d4af37] mb-2 flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  Modern Co-ord & Indo-Western Sets
                </h4>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  For the modern woman who loves fusion. We blend traditional motifs and block prints with contemporary silhouettes to produce comfortable travel wear and office-ready fashion options.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1B0606] border border-[#c5a880]/20 hover:border-[#580C1F] transition-all duration-300 shadow-md">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#580C1F] dark:text-[#d4af37] mb-2 flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  Premium Palazzo & Kurta Sets
                </h4>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  Designed for daily breathability. Our palazzo sets focus on wide, non-constricting legs and skin-friendly cotton linens that offer double-lock stitching for daily wash durability.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1B0606] border border-[#c5a880]/20 hover:border-[#580C1F] transition-all duration-300 shadow-md">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#580C1F] dark:text-[#d4af37] mb-2 flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  Festive Salwar Suits & Lehengas
                </h4>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-light leading-relaxed">
                  Celebrating weddings, pujas, and rituals. We focus on lightweight georgettes and micro-weaves that look rich and heavy without burdening you with excessive fabric weight.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── SECTION 6: WHY TRUST US (3 PROMINENT REASONS) ── */}
        <section className="py-12 sm:py-24 bg-[#24060C] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-[#580C1F] to-black" />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
              <span className="text-[#c5a880] text-xs font-bold uppercase tracking-widest">Section 06</span>
              <SectionHeading className="text-3xl sm:text-4xl text-white" style={{ color: "#ffffff" }}>Why Trust Us?</SectionHeading>
              <div className="w-12 h-[2px] bg-[#c5a880] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="w-6 h-6 text-[#d4af37]" />,
                  title: "We are just like you",
                  desc: "We know what an average Indian woman wants while buying clothes—good fabric, perfect stitching, and the right price."
                },
                {
                  icon: <Award className="w-6 h-6 text-[#d4af37]" />,
                  title: "True Quality, Direct Price",
                  desc: "We eliminate middlemen and deliver clothes directly to you, so that you get the best quality at a lower price."
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-[#d4af37]" />,
                  title: "Transparency First",
                  desc: "What you see in the photo is exactly what will reach your home. Customers' satisfaction is our success."
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-[#c5a880]/15 hover:bg-white/10 transition-all duration-300 flex flex-col items-center text-center gap-3"
                >
                  <div className="p-3.5 rounded-2xl bg-white/10 flex-shrink-0">
                    {item.icon}
                  </div>
                  <h3 className="font-serif font-bold text-lg text-white mt-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#FAF6F0]/90 font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 7: THREE CORE PILLARS (VALUES REFINED) ── */}
        <section className="py-12 sm:py-20 max-w-[1200px] mx-auto px-4 sm:px-6 border-b border-[#c5a880]/15">
          <div className="max-w-2xl mx-auto mb-12 text-center space-y-2">
            <span className="text-[#580C1F] dark:text-[#d4af37] text-xs font-bold uppercase tracking-widest">Section 07</span>
            <SectionHeading className="text-3xl sm:text-4xl">Our Three Core Pillars</SectionHeading>
            <div className="w-12 h-[2px] bg-[#d4af37] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="border-t-2 border-[#d4af37] pt-4 space-y-2 transition-transform duration-300 hover:translate-y-[-2px]">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">I. Transparency & Honesty</h3>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-[#f2fcf9]/90 font-light leading-relaxed">
                Clear descriptions, real product images without extreme studio filters, honest material details, and straightforward refund policies.
              </p>
            </div>

            <div className="border-t-2 border-[#580C1F] dark:border-[#d4af37] pt-4 space-y-2 transition-transform duration-300 hover:translate-y-[-2px]">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">II. Women Empowerment</h3>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-[#f2fcf9]/90 font-light leading-relaxed">
                Nurturing a localized work network in Prayagraj and Deoria, and inspiring self-dependence and creative dreams.
              </p>
            </div>

            <div className="border-t-2 border-[#580C1F] dark:border-[#d4af37] pt-4 space-y-2 transition-transform duration-300 hover:translate-y-[-2px]">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0F15] dark:text-white">III. Direct Care</h3>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-[#f2fcf9]/90 font-light leading-relaxed">
                Personalized query channels handled directly by the co-founders to build deep trust, resolving size options quickly.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 8: PERSONAL MESSAGE TO CUSTOMERS ── */}
        <section className="py-12 sm:py-24 bg-gradient-to-tr from-[#1B0606] to-[#120202] text-white relative overflow-hidden border-y border-[#580C1F]/30">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#d4af37]/5 rounded-full filter blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full filter blur-2xl pointer-events-none" />

          <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8 relative z-10">
            <Quote className="w-10 h-10 sm:w-16 sm:h-16 text-[#d4af37]/20 mx-auto" />

            <h3 className="font-serif text-xs uppercase tracking-widest text-[#dfc384]">Section 08 — A Letter to our Customers</h3>

            <blockquote className="font-serif text-lg sm:text-2xl text-white/95 font-medium italic leading-relaxed">
              "We started Nari Pehnawa with single-minded dedication—to stand on our feet and to bring you the best designs directly. Every order you place is a vote of confidence in our friendship, dreams, and craftsmanship. We promise to never compromise on your trust and satisfaction."
            </blockquote>

            <div className="space-y-1">
              <h4 className="font-bold text-[#dfc384] tracking-wider text-sm sm:text-base animate-pulse">
                — Pooja Verma & Ritika Singh
              </h4>
              <p className="text-[10px] sm:text-xs text-zinc-200 font-bold uppercase tracking-widest">
                Co-Founders of Nari Pehnawa
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ── STANDALONE PREMIUM BOTTOM FOOTER ── */}
      <footer className="bg-[#120202] text-[#F7ECE1]/80 border-t border-[#580C1F]/20 py-8 sm:py-16 px-4 sm:px-6">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 sm:gap-12 items-center text-center md:text-left">

          <div className="space-y-2">
            <h4 className="font-serif text-lg sm:text-2xl font-bold text-white tracking-widest leading-none">NARI PEHNAWA</h4>
            <p className="text-[10px] sm:text-xs text-zinc-400 max-w-sm leading-relaxed mx-auto md:mx-0">
              Celebrating ethnic pride, modern cuts, and factory-direct pricing for standard Indian ladies' garments.
            </p>
          </div>

          <div className="flex justify-center gap-6 text-xs sm:text-sm font-semibold text-zinc-300">
            <Link to="/" className="hover:text-[#d4af37] transition-colors">Home</Link>
            <Link to="/new-arrivals" className="hover:text-[#d4af37] transition-colors">New Arrivals</Link>
            <Link to="/" className="hover:text-[#d4af37] transition-colors">Sale</Link>
          </div>

          <div className="text-zinc-555 text-[10px] sm:text-xs md:text-right leading-relaxed">
            © 2026 Nari Pehnawa. All Rights Reserved.<br />
            Crafted with passion, trust, and dedication.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default OwnerPage;
