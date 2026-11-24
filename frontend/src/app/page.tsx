"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, UtensilsCrossed, Wine, Calendar, ChevronRight, 
  Star, MapPin, Phone, Clock, ShieldCheck, ArrowRight, Check,
  Play, Pause, Volume2, VolumeX, Maximize2, X, MessageSquare, Bot,
  PartyPopper, Compass, ChevronDown, Send, Eye, ShoppingBag, Award
} from "lucide-react";
import { api } from "../lib/api";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { useTableSession } from "../context/TableSessionContext";
import { useCart } from "../context/CartContext";

interface ExperienceVideo {
  id: string;
  title: string;
  category: string;
  description: string;
  video_url: string;
  poster_url: string;
  duration_seconds: number;
  display_order: number;
  is_active: boolean;
  tagline: string;
}

const PUBLIQ_VIDEOS: ExperienceVideo[] = [
  {
    id: "vid-1",
    title: "Fresh Charcoal Tandoor & Grills",
    category: "Live Kitchen & Tandoor",
    description: "Watch our master chefs grill tender kebabs over live charcoal embers and slow-simmer rich Awadhi gravies in our open kitchen.",
    video_url: "/videos/food.mp4",
    poster_url: "/images/publiq/food/tandoori-mixed-grill.webp",
    duration_seconds: 38,
    display_order: 1,
    is_active: true,
    tagline: "Fresh Charcoal Grills & Rich Indian Curries"
  },
  {
    id: "vid-2",
    title: "Handcrafted Cocktails & Mixology",
    category: "Signature Bar & Drinks",
    description: "Watch our master bartenders craft smoked bourbon drinks, edible 24K gold cocktails, and refreshing tropical fruit coolers.",
    video_url: "/videos/cocktails.mp4",
    poster_url: "/images/publiq/drinks/publiq-gold-elixir.webp",
    duration_seconds: 34,
    display_order: 2,
    is_active: true,
    tagline: "Creative Cocktails & Fresh Botanicals"
  },
  {
    id: "vid-3",
    title: "Spirits Cellar & Single Malts",
    category: "Fine Spirits & Craft Beers",
    description: "Explore our curated collection of single malts, aged bourbons, premium wines, and fresh draft craft beers on tap.",
    video_url: "/videos/bar.mp4",
    poster_url: "/images/publiq/drinks/publiq-smoked-bourbon.webp",
    duration_seconds: 42,
    display_order: 3,
    is_active: true,
    tagline: "Premium Whiskies, Wines & Cold Draft Beers"
  },
  {
    id: "vid-4",
    title: "Weekend Live DJ & Nightlife Party",
    category: "Nightlife & Live DJ",
    description: "Feel the electric energy of weekend DJ music, live acoustic sessions, dancing, and cocktail toasts under starlit canopies.",
    video_url: "/videos/party.mp4?v=3",
    poster_url: "/images/publiq/events/publiq-nightlife-party.webp?v=3",
    duration_seconds: 45,
    display_order: 4,
    is_active: true,
    tagline: "Live DJ Music, Great Beats & Party Energy"
  },
  {
    id: "vid-5",
    title: "The Blossom Dining Hall & Atmosphere",
    category: "Dining Experience",
    description: "Relax in our beautiful illuminated floral dining room with velvet booths and private tables made for celebrations.",
    video_url: "/videos/ambience.mp4",
    poster_url: "/images/publiq/interior/publiq-interior-hero.webp",
    duration_seconds: 40,
    display_order: 5,
    is_active: true,
    tagline: "Warm Hospitality & Elegant Ambiance"
  }
];

export default function HomePage() {
  const { isDineInActive, tableNumber, diningArea } = useTableSession();
  const { addItem } = useCart();
  const [videos, setVideos] = useState<ExperienceVideo[]>(PUBLIQ_VIDEOS);
  const [activeModalVideo, setActiveModalVideo] = useState<ExperienceVideo | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Hero Video Controls
  const [heroMuted, setHeroMuted] = useState(true);
  const [heroPlaying, setHeroPlaying] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Dynamic Data States
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");
  const [signatureDishes, setSignatureDishes] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<string>("ALL");
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Private Event Form States
  const [eventFormData, setEventFormData] = useState({
    name: "",
    phone: "",
    email: "",
    event_type: "Private Celebration",
    date: "",
    guests: "20",
    requests: ""
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventSubmittedMsg, setEventSubmittedMsg] = useState<string | null>(null);

  // AI Sommelier Drawer State
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { 
      sender: "ai", 
      text: "Greetings. I am your PUBLIQ Hospitality Concierge. How may I assist you today? Feel free to ask about our single malts, wine pairings, charcoal tandoor specials, or private dining salons." 
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Load backend data
  useEffect(() => {
    async function loadData() {
      try {
        const catData = await api.getCategories();
        if (catData && catData.length > 0) {
          setCategories(catData);
          // Extract signature dishes
          const allItems: any[] = [];
          catData.forEach((c: any) => {
            if (c.items) {
              c.items.forEach((it: any) => {
                allItems.push({ ...it, category_name: c.name, category_slug: c.slug });
              });
            }
          });
          // Pick top 8 items
          setSignatureDishes(allItems.slice(0, 8));
        }

        // Testimonials fallback or backend
        setTestimonials([
          {
            id: 1,
            customer_name: "Vikram Malhotra",
            rating: 5,
            review_text: "The Charcoal Tandoori Platter and Smoked Bourbon cocktail are pure perfection. Spectacular ambiance with floral ceilings!",
            source: "Zomato Gold Diner",
            review_date: "Nov 2026"
          },
          {
            id: 2,
            customer_name: "Ananya Deshmukh",
            rating: 5,
            review_text: "Hosted our team dinner at PUBLIQ. Super smooth table ordering, wonderful Dal Makhani, and attentive service. 10/10!",
            source: "Corporate Guest",
            review_date: "Nov 2026"
          },
          {
            id: 3,
            customer_name: "Rahul & Sneha Kulkarni",
            rating: 5,
            review_text: "Hands down the best weekend vibe in Bengaluru! Great music, craft cocktails, and the Rogan Josh melted in our mouths.",
            source: "Verified Google Review",
            review_date: "Oct 2026"
          }
        ]);

        // Gallery Items
        setGalleryItems([
          { id: "g1", category: "INTERIOR", title: "Blossom Dining Hall", image_url: "/images/publiq/interior/publiq-interior-hero.webp", caption: "Illuminated floral ceiling and velvet private dining booths" },
          { id: "g2", category: "FOOD", title: "Charcoal Tandoori Kebab Platter", image_url: "/images/publiq/food/tandoori-mixed-grill.webp", caption: "Grilled over real live coals with house mint chutney" },
          { id: "g3", category: "COCKTAILS", title: "PUBLIQ Gold Elixir", image_url: "/images/publiq/drinks/publiq-gold-elixir.webp", caption: "24K edible gold dust, saffron syrup, citrus botanicals" },
          { id: "g4", category: "BAR", title: "Aged Single Malt Cellar", image_url: "/images/publiq/drinks/publiq-smoked-bourbon.webp", caption: "Over 60 world whiskies, bourbons, and fine brandies" },
          { id: "g5", category: "EVENTS", title: "Weekend DJ & Nightlife Party", image_url: "/images/publiq/events/publiq-nightlife-party.webp?v=3", caption: "Live beats, dancing, and cocktail toasts every weekend" },
          { id: "g6", category: "FOOD", title: "Slow-Cooked Dum Biryani", image_url: "/images/publiq/food/dum-biryani-hyderabadi.webp", caption: "Aged basmati rice sealed in earthenware handi" },
          { id: "g7", category: "INTERIOR", title: "Sky Terrace Cabanas", image_url: "/images/publiq/interior/publiq-dining-atrium.webp", caption: "Al fresco open-air seating under starlit evening canopies" },
          { id: "g8", category: "COCKTAILS", title: "Smoked Bourbon Old Fashioned", image_url: "/images/publiq/drinks/publiq-smoked-bourbon.webp", caption: "Infused with applewood smoke and Angostura bitters" }
        ]);

      } catch (err) {
        console.error("Failed to load home page dynamic assets:", err);
      }
    }

    loadData();
  }, []);

  const handleHeroAudioToggle = () => {
    if (heroVideoRef.current) {
      heroVideoRef.current.muted = !heroVideoRef.current.muted;
      setHeroMuted(heroVideoRef.current.muted);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventSubmitting(true);
    try {
      // simulate quick submission
      await new Promise(r => setTimeout(r, 600));
      setEventSubmittedMsg("Thank you! Your event enquiry has been received. Our banquet manager will reach out within 2 hours.");
      setEventFormData({
        name: "",
        phone: "",
        email: "",
        event_type: "Private Celebration",
        date: "",
        guests: "20",
        requests: ""
      });
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput.trim();
    setAiMessages(prev => [...prev, { sender: "user", text: userText }]);
    setAiInput("");
    setAiLoading(true);

    try {
      // Simulate intelligent concierge assistance
      await new Promise(r => setTimeout(r, 800));
      let reply = "Our chefs recommend our Signature Tandoori Platter paired with the Smoked Old Fashioned. If you prefer vegetarian selections, our Paneer Tikka Angara and 24-hr Dal Makhani are absolute favorites!";
      
      const lower = userText.toLowerCase();
      if (lower.includes("bar") || lower.includes("drink") || lower.includes("cocktail") || lower.includes("whisky")) {
        reply = "From our bar, we highly recommend the 24K PUBLIQ Gold Elixir or our handcrafted Smoked Bourbon. We also have draft craft beers and fine single malts available.";
      } else if (lower.includes("table") || lower.includes("book") || lower.includes("reserve")) {
        reply = "You can easily reserve your preferred table via our 'Book a Table' button above, or call our direct reservation desk at +91 97417 44886.";
      } else if (lower.includes("price") || lower.includes("menu")) {
        reply = "Our full food and beverage menu is accessible anytime from the top navigation bar. Prices start from ₹180 for appetizers, ₹320 for mains, and drinks from ₹290.";
      }

      setAiMessages(prev => [...prev, { sender: "ai", text: reply }]);
    } catch {
      setAiMessages(prev => [...prev, { 
        sender: "ai", 
        text: "I am pleased to assist. For immediate reservations or sommelier pairings, our hosts are available at +91 97417 44886 or via email at publiqbarresto@gmail.com." 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredGallery = galleryFilter === "ALL" 
    ? galleryItems 
    : galleryItems.filter(g => g.category?.toUpperCase() === galleryFilter);

  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen selection:bg-blue-600/20 selection:text-blue-900">

      {/* ========================================================================= */}
      {/* SECTION 1: CINEMATIC FULL-SCREEN HERO (LUMINOUS WHITE & VIBRANT GRADIENT) */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[640px] lg:min-h-[740px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-white py-16">
        {/* Subtle moving ambient video background with luminous light overlay */}
        <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
          <video
            ref={heroVideoRef}
            src="/videos/hero.mp4"
            poster="/images/publiq/interior/publiq-interior-hero.webp"
            autoPlay
            loop
            muted={heroMuted}
            playsInline
            className="w-full h-full object-cover scale-105 transition-transform duration-1000 ease-out"
          />
        </div>
        {/* Luminous multi-colour gradient overlay: zero black surfaces! */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-blue-50/30 to-white pointer-events-none" />

        {/* Hero Central Typography & Brand Showcase */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Official Brand Logo */}
          <div className="mb-4 flex justify-center animate-fadeIn">
            <img 
              src="/logo.png?v=4" 
              alt="PUBLIQ Bar & Restaurant" 
              className="h-28 sm:h-36 md:h-44 w-auto object-contain drop-shadow-[0_4px_24px_rgba(37,99,235,0.18)] hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Luxury Crest Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-white/95 backdrop-blur-md mb-6 shadow-md shadow-blue-500/10 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-cinzel text-[11px] font-bold tracking-[0.25em] bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent uppercase">
              FINE DINING RESTAURANT &amp; CRAFT BAR
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Authentic Tandoor Grills <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold">&amp; Handcrafted Cocktails</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-slate-600 font-sans leading-relaxed mb-10 font-normal">
            Welcome to PUBLIQ — where fresh charcoal tandoor kebabs, rich butter chicken, delicious biryanis, and handcrafted cocktails come together for an unforgettable dining experience.
          </p>

          {/* Primary Call-to-Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <a
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-cinzel font-bold text-xs tracking-[0.2em] uppercase shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 text-center"
            >
              EXPLORE OUR MENU
            </a>

            <a
              href="/reservations"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-cinzel font-bold text-xs tracking-[0.2em] uppercase shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5 text-center"
            >
              BOOK A TABLE
            </a>

            <a
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-blue-700 font-cinzel font-bold text-xs tracking-[0.2em] uppercase transition-all shadow-md text-center border-2 border-slate-200"
            >
              STAFF PORTAL
            </a>
          </div>

          {/* Current Table Session Pill if Active */}
          {isDineInActive && tableNumber && (
            <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-amber-400 text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-amber-800 font-bold">Active In-Restaurant Session:</span>
              <span className="font-bold text-slate-900 bg-amber-100 px-2 py-0.5 rounded">Table {tableNumber}</span>
              <a href="/menu" className="text-blue-700 font-bold underline ml-1 hover:text-blue-900">Order From Table →</a>
            </div>
          )}

        </div>

        {/* Hero Audio Toggle Button */}
        <button
          onClick={handleHeroAudioToggle}
          className="absolute bottom-8 right-6 sm:right-10 z-20 p-3 rounded-full bg-white/95 hover:bg-white border border-slate-200 text-slate-800 hover:text-blue-600 backdrop-blur-md transition-all shadow-md"
          title={heroMuted ? "Unmute Ambient Video" : "Mute Video"}
          aria-label="Toggle Sound"
        >
          {heroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
        </button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-slate-500 text-[10px] font-cinzel tracking-widest uppercase font-bold">
          <span>SCROLL TO DISCOVER</span>
          <ChevronDown className="w-4 h-4 text-blue-600 animate-bounce" />
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 2: RESTAURANT STORY & PHILOSOPHY (White & Light Blue Luxury Theme)*/}
      {/* ========================================================================= */}
      <section id="story" className="py-24 sm:py-32 bg-gradient-to-br from-[#FAFBFD] via-[#F0F7FF] to-[#E2E8F0] border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left 6 Cols: Editorial Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2">
                <span className="w-6 h-[2px] bg-amber-600" />
                <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-blue-700 font-bold">
                  ABOUT PUBLIQ RESTAURANT &amp; BAR
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight text-slate-900">
                Crafted with Passion, Fresh Ingredients &amp; <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-blue-600 bg-clip-text text-transparent font-extrabold">Authentic Taste</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-700 font-sans leading-relaxed">
                At PUBLIQ Bar &amp; Restaurant, we love good food and great company. Our kitchen brings together the authentic taste of clay tandoor cooking with fresh, premium spices and delicious modern presentations.
              </p>

              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                From our famous 24-hour slow-cooked Dal Makhani and succulent tandoori kebabs to fragrant biryanis and creative cocktails, every plate is prepared with heart. Dine under our illuminated floral canopies or unwind at our cocktail bar.
              </p>

              {/* Chef Quote Card */}
              <div className="p-6 rounded-2xl bg-white border-l-4 border-amber-600 border-y border-r border-slate-200 shadow-md mt-6">
                <p className="italic font-serif text-sm sm:text-base text-slate-900 font-medium">
                  &ldquo;Great food brings people together. We make sure every dish and every drink gives you an unforgettable celebration.&rdquo;
                </p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-700">Chef Rajeshwar Rawat</span>
                  <span className="text-slate-500 font-medium">Executive Head Chef</span>
                </div>
              </div>

              {/* Quick Pillars */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center">
                <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-xs">
                  <span className="block font-serif text-2xl font-bold text-sky-600">24 hrs</span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold">Slow-Cooked Dal</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-xs">
                  <span className="block font-serif text-2xl font-bold text-amber-600">100%</span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold">Live Charcoal Embers</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs">
                  <span className="block font-serif text-2xl font-bold text-indigo-600">Craft Bar</span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold">Fresh Signature Drinks</span>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Curated Imagery Composition */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-sky-200 shadow-xl group">
                <img 
                  src="/images/publiq/interior/publiq-dining-atrium.webp" 
                  alt="PUBLIQ Blossom Dining Atrium" 
                  className="w-full h-[450px] sm:h-[550px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Architectural Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-between text-slate-900">
                  <div>
                    <span className="text-[10px] font-cinzel uppercase tracking-widest text-blue-600 font-bold">VENUE SPOTLIGHT</span>
                    <h4 className="font-serif text-base text-slate-900 font-bold">The Blossom Dining Atrium</h4>
                  </div>
                  <a href="/reservations" className="text-xs text-blue-600 hover:text-amber-600 font-cinzel font-bold tracking-wider">
                    RESERVE NOW →
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 3: SIGNATURE EXPERIENCE & VIDEO SHOWCASE                           */}
      {/* ========================================================================= */}
      <section className="py-24 relative bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-amber-600 font-bold">
              EXPLORE OUR DINING &amp; NIGHTLIFE
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
              See What Makes <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-blue-600 bg-clip-text text-transparent">PUBLIQ Special</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Click any video clip below to watch our live kitchen grills, handcrafted cocktails, spirits cellar, and high-energy weekend DJ nights.
            </p>
          </div>

          {/* 4 Interactive Experience Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.slice(0, 4).map((vid) => (
              <div 
                key={vid.id}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white flex flex-col justify-between hover:border-blue-400 hover:shadow-xl transition-all duration-300 shadow-xs"
              >
                {/* Video / Poster Thumbnail */}
                <div className="relative w-full h-56 overflow-hidden">
                  <img 
                    src={vid.poster_url} 
                    alt={vid.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Play Button Trigger */}
                  <button
                    onClick={() => setActiveModalVideo(vid)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 border border-amber-500 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-md cursor-pointer"
                    aria-label={`Play ${vid.title}`}
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </button>

                  <span className="absolute top-3 left-3 text-[10px] font-cinzel font-bold tracking-wider text-slate-900 bg-white/90 px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                    {vid.category}
                  </span>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed font-normal">
                      {vid.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveModalVideo(vid)}
                    className="text-xs font-cinzel font-bold tracking-wider text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 pt-2 border-t border-slate-100 w-full justify-between"
                  >
                    <span>WATCH CLIP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 4: MENU CATEGORIES (ALL 17 SPECIFIED CATEGORIES)                  */}
      {/* ========================================================================= */}
      <section id="menu-categories" className="py-24 relative bg-gradient-to-b from-[#F8FAFC] via-[#EFF6FF] to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-blue-600 font-bold">
              OUR DELICIOUS MENU
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
              Explore Food &amp; <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Drinks by Category</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Browse all 17 categories crafted fresh by our master chefs and bartenders. Click any category to view full dishes and prices.
            </p>
          </div>

          {/* 17 Category Badges / Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-14">
            <button
              onClick={() => setActiveCategorySlug("all")}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-cinzel tracking-wider uppercase transition-all cursor-pointer ${
                activeCategorySlug === "all"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md"
                  : "bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-xs"
              }`}
            >
              All Categories
            </button>

            {categories.map((c) => (
              <button
                key={c.id || c.slug}
                onClick={() => setActiveCategorySlug(c.slug)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-cinzel tracking-wider uppercase transition-all cursor-pointer ${
                  activeCategorySlug === c.slug
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md"
                    : "bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-xs"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Category Visual Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {(activeCategorySlug === "all" 
              ? categories 
              : categories.filter(c => c.slug === activeCategorySlug)
            ).map((c) => {
              const s = (c.slug || "").toLowerCase();
              let borderClass = "border-slate-200 hover:border-amber-400";
              let tagBg = "bg-amber-50 text-amber-800 border-amber-200";

              if (s.includes("cocktail")) {
                borderClass = "border-sky-200 hover:border-sky-500";
                tagBg = "bg-sky-50 text-sky-800 border-sky-200";
              } else if (s.includes("mocktail") || s.includes("soft-drink")) {
                borderClass = "border-teal-200 hover:border-teal-500";
                tagBg = "bg-teal-50 text-teal-800 border-teal-200";
              } else if (s.includes("tandoor") || s.includes("kebab")) {
                borderClass = "border-amber-200 hover:border-amber-500";
                tagBg = "bg-amber-50 text-amber-800 border-amber-200";
              } else if (s.includes("biryani")) {
                borderClass = "border-yellow-200 hover:border-yellow-500";
                tagBg = "bg-yellow-50 text-yellow-800 border-yellow-200";
              } else if (s.includes("curry") || s.includes("main")) {
                borderClass = "border-orange-200 hover:border-orange-500";
                tagBg = "bg-orange-50 text-orange-800 border-orange-200";
              } else if (s.includes("veg") && !s.includes("non")) {
                borderClass = "border-emerald-200 hover:border-emerald-500";
                tagBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
              } else if (s.includes("dessert")) {
                borderClass = "border-rose-200 hover:border-rose-500";
                tagBg = "bg-rose-50 text-rose-800 border-rose-200";
              } else if (s.includes("seafood") || s.includes("fish") || s.includes("prawn")) {
                borderClass = "border-cyan-200 hover:border-cyan-500";
                tagBg = "bg-cyan-50 text-cyan-800 border-cyan-200";
              }

              return (
                <a
                  key={c.id || c.slug}
                  href={`/menu?category=${encodeURIComponent(c.name)}`}
                  className={`group relative rounded-2xl overflow-hidden border ${borderClass} bg-white transition-all duration-300 shadow-xs hover:-translate-y-1 hover:shadow-xl flex flex-col`}
                >
                  <div className="w-full h-40 sm:h-48 overflow-hidden relative">
                    <img 
                      src={c.image_url || "/images/publiq/food/butter-chicken-delhi.webp"} 
                      alt={c.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/images/publiq/food/butter-chicken-delhi.webp";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tagBg} backdrop-blur-md border uppercase tracking-wider shadow-xs`}>
                      {c.is_alcohol ? "Bar Collection" : "Chef Special"}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 font-normal">
                        {c.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-cinzel uppercase tracking-widest text-blue-600 mt-3 inline-flex items-center gap-1 font-bold">
                      <span>EXPLORE OFFERINGS</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 5: SIGNATURE DISHES (AUTHENTIC DISH CARDS WITH DETAILS MODAL)      */}
      {/* ========================================================================= */}
      <section id="dishes" className="py-24 relative bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-amber-600 font-bold">
                CHEF&apos;S TOP PICKS
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
                Customer Favorites &amp; <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Signature Dishes</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-normal">
                The most loved dishes and handcrafted drinks ordered by our guests every single day.
              </p>
            </div>

            <a
              href="/menu"
              className="inline-flex items-center gap-2 text-xs font-cinzel font-bold tracking-widest text-blue-600 hover:text-blue-800 uppercase"
            >
              <span>VIEW FULL DIGITAL MENU</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Signature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {signatureDishes.map((dish) => (
              <div
                key={dish.id}
                className="group rounded-2xl overflow-hidden border border-slate-200 bg-white flex flex-col justify-between hover:border-blue-400 transition-all duration-300 shadow-xs hover:shadow-xl"
              >
                <div className="relative w-full h-56 overflow-hidden">
                  <img
                    src={dish.image_url || "/images/publiq/food/butter-chicken-delhi.webp"}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/images/publiq/food/butter-chicken-delhi.webp";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span 
                      className={`w-4 h-4 rounded-sm flex items-center justify-center p-0.5 border ${
                        dish.is_veg ? "border-emerald-500 bg-white" : "border-rose-500 bg-white"
                      }`}
                      title={dish.is_veg ? "Vegetarian" : "Non-Vegetarian"}
                    >
                      <span className={`w-2 h-2 rounded-full ${dish.is_veg ? "bg-emerald-600" : "bg-rose-600"}`} />
                    </span>
                  </div>

                  {/* Price Tag Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <span className="font-serif text-sm font-bold text-slate-900">
                      ₹{dish.base_price?.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {dish.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProduct(dish)}
                      className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-cinzel font-bold tracking-wider text-slate-800 hover:text-blue-600 transition-colors text-center"
                    >
                      DETAILS
                    </button>
                    <button
                      onClick={() => addItem({ item_id: dish.id, quantity: 1 })}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center"
                      title="Add to Dining Cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 6: ATMOSPHERE & RESTAURANT EXPERIENCE                              */}
      {/* ========================================================================= */}
      <section id="bar" className="py-24 relative bg-gradient-to-b from-slate-50 via-sky-50/20 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 5 Cols: Atmosphere Narrative */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-blue-600 font-bold">
                OUR DINING SPACES
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Warm Ambiance, Music &amp; <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Great Food</span>
              </h2>
              <p className="text-sm text-slate-600 font-sans leading-relaxed">
                Whether you are joining us for a relaxed family dinner, a romantic date, or drinks with friends, PUBLIQ has the perfect setting for you.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="font-serif text-base text-slate-900 font-bold">The Blossom Dining Hall</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Spacious floral ceiling canopy with comfortable plush booths for family dining.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="font-serif text-base text-slate-900 font-bold">The Resto-Bar Counter</h4>
                  <p className="text-xs text-slate-600 mt-0.5">High-energy seating right next to our bartenders, craft cocktails, and spirits cellar.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="font-serif text-base text-slate-900 font-bold">Sky Terrace &amp; Outdoor Deck</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Open-air evening seating with beautiful skyline views, warm lights, and fresh drinks.</p>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Video & Ambient Showcase */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                <video
                  src="/videos/ambience.mp4"
                  poster="/images/publiq/interior/publiq-interior-hero.webp"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[10px] font-cinzel uppercase tracking-widest text-blue-600 font-bold">LIVE AMBIENCE</span>
                    <h4 className="font-serif text-lg font-bold text-slate-900">Evenings at PUBLIQ</h4>
                  </div>
                  <a
                    href="/reservations"
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-cinzel font-bold text-xs uppercase shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    BOOK TABLE
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 7: PHOTO & VIDEO GALLERY                                          */}
      {/* ========================================================================= */}
      <section id="gallery" className="py-24 relative bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-blue-600 font-bold">
              PHOTO &amp; VIDEO MOMENTS
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
              Moments at <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">PUBLIQ</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A glimpse of our delicious food, handcrafted cocktails, dining spaces, and weekend celebrations.
            </p>
          </div>

          {/* Gallery Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {["ALL", "INTERIOR", "FOOD", "COCKTAILS", "BAR", "EVENTS"].map((cat) => (
              <button
                key={cat}
                onClick={() => setGalleryFilter(cat)}
                className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-cinzel tracking-wider uppercase transition-all cursor-pointer ${
                  galleryFilter === cat
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md"
                    : "bg-slate-100 text-slate-700 hover:text-blue-600 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredGallery.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setActiveLightboxImg(item.image_url)}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-500 bg-white cursor-pointer h-60 sm:h-72 shadow-xs hover:shadow-xl transition-all"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/publiq/interior/publiq-interior-hero.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 border-b-2 border-blue-600">
                  <span className="text-[10px] font-cinzel text-blue-700 uppercase tracking-widest font-bold">
                    {item.category}
                  </span>
                  <h4 className="font-serif text-sm sm:text-base text-slate-900 font-bold">
                    {item.title}
                  </h4>
                  {item.caption && (
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 8: GUEST TESTIMONIALS (Crisp Ice Blue & White Luxury Theme)       */}
      {/* ========================================================================= */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-[#F0F7FF] via-[#E0F2FE] to-[#F8FAFC] border-b border-[#BAE6FD] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#38BDF8]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#0284C7] font-bold">
              GUEST REVIEWS &amp; FEEDBACK
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#0F172A]">
              What Our Guests <span className="bg-gradient-to-r from-[#B45309] to-[#D4AF37] bg-clip-text text-transparent">Love About Us</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#334155] font-medium">
              Real feedback from guests who have dined, celebrated birthdays, and spent evenings with us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={t.id || idx}
                className="p-8 rounded-2xl bg-white border border-[#38BDF8]/40 flex flex-col justify-between space-y-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                    ))}
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-slate-800 leading-relaxed italic font-medium">
                    &ldquo;{t.review_text}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-serif font-bold text-slate-900">{t.customer_name}</h4>
                    <span className="text-[11px] text-blue-600 font-semibold">{t.source || "Dine-In Guest"}</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-mono font-bold">{t.review_date}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 9: PRIVATE EVENTS & BANQUET ENQUIRY FORM                          */}
      {/* ========================================================================= */}
      <section id="events" className="py-24 relative bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 6 Cols: Event Offerings */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-blue-600 font-bold">
                PARTIES &amp; PRIVATE CELEBRATIONS
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Host Your Special Party <br />
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">at PUBLIQ</span>
              </h2>
              <p className="text-sm text-slate-600 font-sans leading-relaxed">
                Whether you are celebrating a birthday, anniversary, family get-together, or corporate dinner, our team handles everything from delicious custom menus to private dining seating.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <PartyPopper className="w-5 h-5 text-amber-600 mb-2" />
                  <h4 className="font-serif text-sm font-bold text-slate-900">Birthdays &amp; Parties</h4>
                  <p className="text-[11px] text-slate-600 mt-1">Custom food packages, party cakes &amp; music.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <Award className="w-5 h-5 text-blue-600 mb-2" />
                  <h4 className="font-serif text-sm font-bold text-slate-900">Corporate Dinners</h4>
                  <p className="text-[11px] text-slate-600 mt-1">Private dining, GST billing &amp; drink packages.</p>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Connected Enquiry Form */}
            <div className="lg:col-span-6">
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl">
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                  Plan Your Event
                </h3>
                <p className="text-xs text-slate-600 mb-6">
                  Fill in your details and our restaurant team will call you back within 2 hours.
                </p>

                {eventSubmittedMsg ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-3">
                    <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-sm">{eventSubmittedMsg}</p>
                    <button
                      onClick={() => setEventSubmittedMsg(null)}
                      className="px-4 py-1.5 rounded-full bg-emerald-700 text-white text-xs underline font-semibold"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEventSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Your Name</label>
                        <input
                          type="text"
                          required
                          value={eventFormData.name}
                          onChange={e => setEventFormData({ ...eventFormData, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                          placeholder="Your Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Contact Phone</label>
                        <input
                          type="tel"
                          required
                          value={eventFormData.phone}
                          onChange={e => setEventFormData({ ...eventFormData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                          placeholder="+91 98000 00000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Email Address</label>
                        <input
                          type="email"
                          required
                          value={eventFormData.email}
                          onChange={e => setEventFormData({ ...eventFormData, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                          placeholder="guest@domain.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Event Type</label>
                        <select
                          value={eventFormData.event_type}
                          onChange={e => setEventFormData({ ...eventFormData, event_type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                        >
                          <option value="Private Celebration">Private Celebration</option>
                          <option value="Birthday Milestone">Birthday Milestone</option>
                          <option value="Corporate Soiree">Corporate Soiree</option>
                          <option value="Private Dining Salon">Private Dining Salon</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Preferred Date</label>
                        <input
                          type="date"
                          required
                          value={eventFormData.date}
                          onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Guest Count</label>
                        <input
                          type="number"
                          min="2"
                          max="200"
                          value={eventFormData.guests}
                          onChange={e => setEventFormData({ ...eventFormData, guests: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-cinzel text-slate-700 uppercase tracking-wider mb-1 font-semibold">Special Requirements</label>
                      <textarea
                        rows={3}
                        value={eventFormData.requests}
                        onChange={e => setEventFormData({ ...eventFormData, requests: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
                        placeholder="Dietary requests, champagne preferences, music setup..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={eventSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-cinzel font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all cursor-pointer"
                    >
                      {eventSubmitting ? "Submitting..." : "REQUEST EVENT PROPOSAL"}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 10: DUAL ACTIONS (RESERVE TABLE & EXPLORE MENU)                   */}
      {/* ========================================================================= */}
      <section className="py-20 relative bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: Dine-In Reservation */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-50 via-blue-50 to-white border border-blue-200 flex flex-col justify-between space-y-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <div>
                <span className="text-[10px] font-cinzel uppercase tracking-[0.25em] text-blue-600 font-bold">
                  DINE-IN AT PUBLIQ
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1 mb-3">
                  Book Your Dining Table
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Reserve your favorite table in our central dining room, cocktail bar lounge, or outdoor rooftop terrace. Instant confirmation and zero wait times.
                </p>
              </div>

              <a
                href="/reservations"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-cinzel font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:from-blue-700 hover:to-indigo-700"
              >
                <Calendar className="w-4 h-4" />
                <span>BOOK A TABLE NOW</span>
              </a>
            </div>

            {/* Card 2: Culinary Craft & Menu */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border border-amber-200 text-slate-900 flex flex-col justify-between space-y-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
              <div>
                <span className="text-[10px] font-cinzel uppercase tracking-[0.25em] text-amber-600 font-bold">
                  CULINARY EXCELLENCE
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1 mb-3">
                  Explore Food &amp; Drinks Menu
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover our sizzling charcoal tandoori kebabs, rich Awadhi curries, fragrant handi biryanis, and artisanal cocktails crafted by master mixologists.
                </p>
              </div>

              <a
                href="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-cinzel font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>VIEW COMPLETE MENU</span>
              </a>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* FLOATING AI SOMMELIER & CONCIERGE BUTTON                                  */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setAiDrawerOpen(true)}
          className="group flex items-center gap-3 px-4 py-3 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-blue-600 shadow-xl backdrop-blur-md transition-all cursor-pointer"
          title="Open AI Sommelier & Restaurant Concierge"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block font-cinzel text-[10px] uppercase tracking-wider text-blue-600 font-bold">AI ASSISTANT</span>
            <span className="text-xs font-bold text-slate-800">Ask Menu Helper</span>
          </div>
        </button>
      </div>

      {/* AI SOMMELIER DRAWER */}
      {aiDrawerOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[420px] bg-white border-r border-slate-200 shadow-2xl flex flex-col justify-between animate-fadeIn">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-slate-900">PUBLIQ Menu Assistant</h4>
                <span className="text-[10px] text-blue-600 font-cinzel font-bold tracking-wider">AI FOOD &amp; DRINKS GUIDE</span>
              </div>
            </div>
            <button
              onClick={() => setAiDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans bg-slate-50/50">
            {aiMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-blue-600 text-white font-medium" 
                    : "bg-white text-slate-800 border border-slate-200 shadow-xs"
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex items-center gap-2 text-xs text-blue-600 italic">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Checking menu dishes and recommendations...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleAiSend} className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask about dishes, recommendations, cocktails..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}


      {/* ========================================================================= */}
      {/* VIDEO CLIP MODAL (Full HD AVC1 Universal Playback)                       */}
      {/* ========================================================================= */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 hover:text-blue-600 border border-slate-200 text-xs font-cinzel font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                title={isVideoMuted ? "Unmute Audio" : "Mute Audio"}
              >
                <span>{isVideoMuted ? "UNMUTE 🔊" : "MUTED 🔇"}</span>
              </button>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md text-slate-800 hover:text-rose-600 border border-slate-200 transition-colors shadow-sm"
                aria-label="Close Video Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-slate-100">
              <video
                key={activeModalVideo.id}
                src={activeModalVideo.video_url}
                poster={activeModalVideo.poster_url}
                autoPlay
                muted={isVideoMuted}
                controls
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-cinzel text-blue-600 uppercase tracking-widest font-bold">
                  {activeModalVideo.category} • {activeModalVideo.tagline}
                </span>
                <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                  {activeModalVideo.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-2xl font-medium">
                  {activeModalVideo.description}
                </p>
              </div>
              <a
                href="/reservations"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-cinzel font-bold text-xs uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center shrink-0 shadow-md"
              >
                BOOK THIS EXPERIENCE
              </a>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL FOR GALLERY IMAGES                                         */}
      {/* ========================================================================= */}
      {activeLightboxImg && (
        <div 
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-md"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={activeLightboxImg} alt="PUBLIQ Gallery Preview" className="w-full h-auto max-h-[85vh] object-contain" />
          </div>
        </div>
      )}


      {/* PRODUCT DETAILS MODAL */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

    </div>
  );
}
