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
          const sigs = allItems.filter(it => it.is_signature || it.is_bestseller);
          setSignatureDishes(sigs.length > 0 ? sigs.slice(0, 8) : allItems.slice(0, 8));
        }

        const vids = await api.getExperienceVideos();
        if (vids && vids.length > 0) {
          setVideos(vids);
        }

        const gallery = await api.getGallery();
        if (gallery && gallery.length > 0) {
          setGalleryItems(gallery);
        }

        const reviews = await api.getTestimonials();
        if (reviews && reviews.length > 0) {
          setTestimonials(reviews);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      }
    }
    loadData();
  }, []);

  const handleHeroAudioToggle = () => {
    if (heroVideoRef.current) {
      heroVideoRef.current.muted = !heroMuted;
      setHeroMuted(!heroMuted);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventSubmitting(true);
    try {
      const res = await api.submitEventEnquiry({
        name: eventFormData.name,
        phone: eventFormData.phone,
        email: eventFormData.email,
        event_type: eventFormData.event_type,
        event_date: eventFormData.date,
        guest_count: parseInt(eventFormData.guests) || 15,
        special_requests: eventFormData.requests
      });
      setEventSubmittedMsg(res.message || "Thank you. Our Event Director will contact you within 2 hours.");
      setEventFormData({ name: "", phone: "", email: "", event_type: "Private Celebration", date: "", guests: "20", requests: "" });
    } catch (err: any) {
      setEventSubmittedMsg("Your enquiry has been received. Our concierge will be in touch shortly.");
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setAiLoading(true);

    try {
      const res = await api.askAiAssistant(userMsg, { tableNumber, diningArea });
      setAiMessages(prev => [...prev, { sender: "ai", text: res.reply }]);
    } catch (err) {
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
    <div className="bg-[#070B12] text-[#CBD5E1] min-h-screen selection:bg-[#D4AF37]/30 selection:text-[#FDFBF7]">

      {/* ========================================================================= */}
      {/* SECTION 1: CINEMATIC FULL-SCREEN HERO                                     */}
      {/* ========================================================================= */}
      <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Ambient Video with Poster Fallback */}
        <div className="absolute inset-0 w-full h-full">
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
          {/* Dark Luxury Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/60 to-[#070B12]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,11,18,0.2)_0%,rgba(7,11,18,0.85)_100%)]" />
        </div>

        {/* Hero Central Typography & Brand Showcase */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* Official Brand Logo */}
          <div className="mb-4 flex justify-center animate-fadeIn">
            <img 
              src="/logo.png?v=4" 
              alt="PUBLIQ Bar & Restaurant" 
              className="h-28 sm:h-36 md:h-44 w-auto object-contain drop-shadow-[0_0_35px_rgba(212,175,55,0.45)]"
            />
          </div>

          {/* Luxury Crest Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#0F1626]/80 backdrop-blur-md mb-6 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-cinzel text-[11px] font-semibold tracking-[0.25em] text-[#E5C378] uppercase">
              FINE DINING RESTAURANT &amp; CRAFT BAR
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#FDFBF7] leading-[1.1] mb-6">
            Authentic Tandoor Grills <br />
            <span className="gold-shimmer">&amp; Handcrafted Cocktails</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-[#EDE8DC] font-sans leading-relaxed mb-10 font-normal">
            Welcome to PUBLIQ — where fresh charcoal tandoor kebabs, rich butter chicken, delicious biryanis, and handcrafted cocktails come together for an unforgettable dining experience.
          </p>

          {/* Dual Primary Call-to-Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <a
              href="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-cinzel font-bold text-xs tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:shadow-[0_0_45px_rgba(212,175,55,0.55)] transition-all transform hover:-translate-y-0.5 text-center"
            >
              EXPLORE OUR MENU
            </a>

            <a
              href="/reservations"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-[#D4AF37]/60 text-[#FDFBF7] hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-white/5 font-cinzel font-bold text-xs tracking-[0.2em] uppercase backdrop-blur-md transition-all text-center"
            >
              BOOK A TABLE
            </a>
          </div>

          {/* Current Table Session Pill if Active */}
          {isDineInActive && tableNumber && (
            <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#121826]/90 border border-[#D4AF37]/50 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span className="text-[#D4AF37] font-semibold">Active In-Restaurant Session:</span>
              <span className="font-bold text-white bg-[#D4AF37]/20 px-2 py-0.5 rounded">Table {tableNumber}</span>
              <a href="/menu" className="text-white underline ml-1 hover:text-[#D4AF37]">Order From Table →</a>
            </div>
          )}

        </div>

        {/* Hero Audio Toggle Button */}
        <button
          onClick={handleHeroAudioToggle}
          className="absolute bottom-8 right-6 sm:right-10 z-20 p-3 rounded-full bg-[#0F1626]/80 hover:bg-[#0F1626] border border-[#D4AF37]/30 text-[#FDFBF7] hover:text-[#D4AF37] backdrop-blur-md transition-all shadow-lg"
          title={heroMuted ? "Unmute Ambient Video" : "Mute Video"}
          aria-label="Toggle Sound"
        >
          {heroMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
        </button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-[#D4AF37]/70 text-[10px] font-cinzel tracking-widest uppercase">
          <span>SCROLL TO DISCOVER</span>
          <ChevronDown className="w-4 h-4 text-[#D4AF37] animate-bounce" />
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 2: RESTAURANT STORY & PHILOSOPHY (White & Light Blue Luxury Theme)*/}
      {/* ========================================================================= */}
      <section id="story" className="py-24 sm:py-32 bg-gradient-to-br from-[#FAFBFD] via-[#F0F7FF] to-[#E2E8F0] border-b border-[#CBD5E1] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#38BDF8]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left 6 Cols: Editorial Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2">
                <span className="w-6 h-[2px] bg-[#B45309]" />
                <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#0369A1] font-bold">
                  ABOUT PUBLIQ RESTAURANT &amp; BAR
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight !text-[#0F172A]" style={{ color: "#0F172A" }}>
                Crafted with Passion, Fresh Ingredients &amp; <span className="bg-gradient-to-r from-[#B45309] via-[#D4AF37] to-[#0284C7] bg-clip-text text-transparent font-extrabold">Authentic Taste</span>
              </h2>

              <p className="text-sm sm:text-base !text-[#1E293B] font-sans leading-relaxed" style={{ color: "#1E293B" }}>
                At PUBLIQ Bar &amp; Restaurant, we love good food and great company. Our kitchen brings together the authentic taste of clay tandoor cooking with fresh, premium spices and delicious modern presentations.
              </p>

              <p className="text-sm sm:text-base !text-[#334155] font-sans leading-relaxed" style={{ color: "#334155" }}>
                From our famous 24-hour slow-cooked Dal Makhani and succulent tandoori kebabs to fragrant biryanis and creative cocktails, every plate is prepared with heart. Dine under our illuminated floral canopies or unwind at our cocktail bar.
              </p>

              {/* Chef Quote Card */}
              <div className="p-6 rounded-2xl bg-white/95 border-l-4 border-[#B45309] border-y border-r border-[#CBD5E1] shadow-xl mt-6">
                <p className="italic font-serif text-sm sm:text-base !text-[#0F172A] font-medium" style={{ color: "#0F172A" }}>
                  &ldquo;Great food brings people together. We make sure every dish and every drink gives you an unforgettable celebration.&rdquo;
                </p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-bold !text-[#B45309]" style={{ color: "#B45309" }}>Chef Rajeshwar Rawat</span>
                  <span className="!text-[#475569] font-medium" style={{ color: "#475569" }}>Executive Head Chef</span>
                </div>
              </div>

              {/* Quick Pillars */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#CBD5E1] text-center">
                <div className="bg-white/90 p-3.5 rounded-2xl border border-[#BAE6FD] shadow-md">
                  <span className="block font-serif text-2xl font-bold !text-[#0284C7]" style={{ color: "#0284C7" }}>24 hrs</span>
                  <span className="text-[11px] uppercase tracking-wider !text-[#1E293B] font-bold" style={{ color: "#1E293B" }}>Slow-Cooked Dal</span>
                </div>
                <div className="bg-white/90 p-3.5 rounded-2xl border border-[#BAE6FD] shadow-md">
                  <span className="block font-serif text-2xl font-bold !text-[#B45309]" style={{ color: "#B45309" }}>100%</span>
                  <span className="text-[11px] uppercase tracking-wider !text-[#1E293B] font-bold" style={{ color: "#1E293B" }}>Live Charcoal Embers</span>
                </div>
                <div className="bg-white/90 p-3.5 rounded-2xl border border-[#BAE6FD] shadow-md">
                  <span className="block font-serif text-2xl font-bold !text-[#0284C7]" style={{ color: "#0284C7" }}>Craft Bar</span>
                  <span className="text-[11px] uppercase tracking-wider !text-[#1E293B] font-bold" style={{ color: "#1E293B" }}>Fresh Signature Drinks</span>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Curated Imagery Composition */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#38BDF8]/40 shadow-2xl group">
                <img 
                  src="/images/publiq/interior/publiq-dining-atrium.webp" 
                  alt="PUBLIQ Blossom Dining Atrium" 
                  className="w-full h-[450px] sm:h-[550px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent" />
                
                {/* Floating Architectural Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-[#38BDF8]/40 shadow-xl flex items-center justify-between text-[#0F172A]">
                  <div>
                    <span className="text-[10px] font-cinzel uppercase tracking-widest !text-[#0284C7] font-bold" style={{ color: "#0284C7" }}>VENUE SPOTLIGHT</span>
                    <h4 className="font-serif text-base !text-[#0F172A] font-bold" style={{ color: "#0F172A" }}>The Blossom Dining Atrium</h4>
                  </div>
                  <a href="/reservations" className="text-xs !text-[#0284C7] hover:!text-[#B45309] font-cinzel font-bold tracking-wider" style={{ color: "#0284C7" }}>
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
      <section className="py-24 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.94), rgba(7,11,18,0.96)), url('/images/publiq/backgrounds/bg-events.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
              EXPLORE OUR DINING &amp; NIGHTLIFE
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FDFBF7]">
              See What Makes <span className="gold-shimmer">PUBLIQ Special</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
              Click any video clip below to watch our live kitchen grills, handcrafted cocktails, spirits cellar, and high-energy weekend DJ nights.
            </p>
          </div>

          {/* 4 Interactive Experience Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.slice(0, 4).map((vid) => (
              <div 
                key={vid.id}
                className="group relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 bg-[#0F1626] flex flex-col justify-between hover:border-[#D4AF37]/60 transition-all duration-500 shadow-xl"
              >
                {/* Video / Poster Thumbnail */}
                <div className="relative w-full h-56 overflow-hidden">
                  <img 
                    src={vid.poster_url} 
                    alt={vid.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1626] via-transparent to-black/30" />
                  
                  {/* Play Button Trigger */}
                  <button
                    onClick={() => setActiveModalVideo(vid)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#070B12]/80 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#070B12] transition-all shadow-lg cursor-pointer"
                    aria-label={`Play ${vid.title}`}
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </button>

                  <span className="absolute top-3 left-3 text-[10px] font-cinzel font-semibold tracking-wider text-[#FDFBF7] bg-[#070B12]/80 px-2.5 py-1 rounded-md border border-white/10">
                    {vid.category}
                  </span>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#FDFBF7] group-hover:text-[#D4AF37] transition-colors">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-[#CBD5E1] mt-1.5 line-clamp-3 leading-relaxed">
                      {vid.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveModalVideo(vid)}
                    className="text-xs font-cinzel font-semibold tracking-wider text-[#D4AF37] hover:text-[#E5C378] inline-flex items-center gap-1 pt-2 border-t border-white/10 w-full justify-between"
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
      <section id="menu-categories" className="py-24 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(5,8,14,0.94), rgba(5,8,14,0.96)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
              OUR DELICIOUS MENU
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FDFBF7]">
              Explore Food &amp; <span className="gold-shimmer">Drinks by Category</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1]">
              Browse all 17 categories crafted fresh by our master chefs and bartenders. Click any category to view full dishes and prices.
            </p>
          </div>

          {/* 17 Category Badges / Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-14">
            <button
              onClick={() => setActiveCategorySlug("all")}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-cinzel tracking-wider uppercase transition-all cursor-pointer ${
                activeCategorySlug === "all"
                  ? "bg-[#D4AF37] text-[#070B12] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  : "bg-[#0F1626] text-[#CBD5E1] hover:text-[#FDFBF7] border border-white/10"
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
                    ? "bg-[#D4AF37] text-[#070B12] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    : "bg-[#0F1626] text-[#CBD5E1] hover:text-[#FDFBF7] border border-white/10"
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
              let borderClass = "border-[#D4AF37]/30 hover:border-[#D4AF37]";
              let tagBg = "bg-[#D4AF37]/20 text-[#E5C378]";
              let glowOverlay = "from-[#0F1626] via-[#0F1626]/40 to-transparent";

              if (s.includes("cocktail")) {
                borderClass = "border-sky-500/40 hover:border-sky-400";
                tagBg = "bg-sky-500/20 text-sky-300";
                glowOverlay = "from-slate-950 via-sky-950/40 to-transparent";
              } else if (s.includes("mocktail") || s.includes("soft-drink")) {
                borderClass = "border-teal-500/40 hover:border-teal-400";
                tagBg = "bg-teal-500/20 text-teal-300";
                glowOverlay = "from-slate-950 via-teal-950/40 to-transparent";
              } else if (s.includes("tandoor") || s.includes("kebab")) {
                borderClass = "border-amber-600/40 hover:border-amber-400";
                tagBg = "bg-amber-600/20 text-amber-300";
                glowOverlay = "from-slate-950 via-amber-950/40 to-transparent";
              } else if (s.includes("biryani")) {
                borderClass = "border-yellow-500/40 hover:border-yellow-400";
                tagBg = "bg-yellow-500/20 text-yellow-300";
                glowOverlay = "from-slate-950 via-yellow-950/40 to-transparent";
              } else if (s.includes("curry") || s.includes("main")) {
                borderClass = "border-orange-500/40 hover:border-orange-400";
                tagBg = "bg-orange-500/20 text-orange-300";
                glowOverlay = "from-slate-950 via-orange-950/40 to-transparent";
              } else if (s.includes("veg") && !s.includes("non")) {
                borderClass = "border-emerald-500/40 hover:border-emerald-400";
                tagBg = "bg-emerald-500/20 text-emerald-300";
                glowOverlay = "from-slate-950 via-emerald-950/40 to-transparent";
              } else if (s.includes("dessert")) {
                borderClass = "border-rose-500/40 hover:border-rose-400";
                tagBg = "bg-rose-500/20 text-rose-300";
                glowOverlay = "from-slate-950 via-rose-950/40 to-transparent";
              } else if (s.includes("seafood") || s.includes("fish") || s.includes("prawn")) {
                borderClass = "border-cyan-500/40 hover:border-cyan-400";
                tagBg = "bg-cyan-500/20 text-cyan-300";
                glowOverlay = "from-slate-950 via-cyan-950/40 to-transparent";
              }

              return (
                <a
                  key={c.id || c.slug}
                  href={`/menu?category=${encodeURIComponent(c.name)}`}
                  className={`group relative rounded-2xl overflow-hidden border ${borderClass} bg-[#0A101D] transition-all duration-500 shadow-xl hover:-translate-y-1 hover:shadow-2xl flex flex-col`}
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
                    <div className={`absolute inset-0 bg-gradient-to-t ${glowOverlay}`} />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tagBg} backdrop-blur-md border border-white/10 uppercase tracking-wider`}>
                      {c.is_alcohol ? "Bar Collection" : "Chef Special"}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#FDFBF7] group-hover:text-[#D4AF37] transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-[#CBD5E1] line-clamp-2 mt-1">
                        {c.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#D4AF37] mt-3 inline-flex items-center gap-1 font-bold">
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
      <section id="dishes" className="py-24 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.95), rgba(7,11,18,0.93)), url('/images/publiq/backgrounds/bg-menu.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
                CHEF&apos;S TOP PICKS
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FDFBF7]">
                Customer Favorites &amp; <span className="gold-shimmer">Signature Dishes</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl">
                The most loved dishes and handcrafted drinks ordered by our guests every single day.
              </p>
            </div>

            <a
              href="/menu"
              className="inline-flex items-center gap-2 text-xs font-cinzel font-bold tracking-widest text-[#D4AF37] hover:text-[#E5C378] uppercase"
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
                className="group rounded-2xl overflow-hidden border border-[#D4AF37]/20 bg-[#0F1626] flex flex-col justify-between hover:border-[#D4AF37]/60 transition-all duration-500 shadow-xl"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1626] via-transparent to-black/30" />
                  
                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span 
                      className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center p-0.5 border ${
                        dish.is_veg ? "border-emerald-500 bg-emerald-950/80" : "border-rose-500 bg-rose-950/80"
                      }`}
                      title={dish.is_veg ? "Vegetarian" : "Non-Vegetarian"}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dish.is_veg ? "bg-emerald-400" : "bg-rose-400"}`} />
                    </span>
                  </div>

                  {/* Price Tag Badge */}
                  <div className="absolute bottom-3 left-3 bg-[#070B12]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#D4AF37]/40">
                    <span className="font-serif text-sm font-bold text-[#D4AF37]">
                      ₹{dish.base_price?.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#FDFBF7] group-hover:text-[#D4AF37] transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-[#CBD5E1] line-clamp-2 mt-1.5 leading-relaxed font-light">
                      {dish.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProduct(dish)}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-cinzel tracking-wider text-[#FDFBF7] hover:text-[#D4AF37] transition-colors text-center"
                    >
                      DETAILS
                    </button>
                    <button
                      onClick={() => addItem({ item_id: dish.id, quantity: 1 })}
                      className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#070B12] text-xs font-bold transition-all shadow-md flex items-center justify-center"
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
      <section id="bar" className="py-24 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(12,9,16,0.93), rgba(7,11,18,0.96)), url('/images/publiq/backgrounds/bg-bar.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 5 Cols: Atmosphere Narrative */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
                OUR DINING SPACES
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FDFBF7] leading-tight">
                Warm Ambiance, Music &amp; <span className="gold-shimmer">Great Food</span>
              </h2>
              <p className="text-sm text-[#EDE8DC] font-sans leading-relaxed">
                Whether you are joining us for a relaxed family dinner, a romantic date, or drinks with friends, PUBLIQ has the perfect setting for you.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-[#0F1626] border border-white/5">
                  <h4 className="font-serif text-base text-[#FDFBF7] font-semibold">The Blossom Dining Hall</h4>
                  <p className="text-xs text-[#CBD5E1] mt-0.5">Spacious floral ceiling canopy with comfortable plush booths for family dining.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0F1626] border border-white/5">
                  <h4 className="font-serif text-base text-[#FDFBF7] font-semibold">The Resto-Bar Counter</h4>
                  <p className="text-xs text-[#CBD5E1] mt-0.5">High-energy seating right next to our bartenders, craft cocktails, and spirits cellar.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0F1626] border border-white/5">
                  <h4 className="font-serif text-base text-[#FDFBF7] font-semibold">Sky Terrace &amp; Outdoor Deck</h4>
                  <p className="text-xs text-[#CBD5E1] mt-0.5">Open-air evening seating with beautiful skyline views, warm lights, and fresh drinks.</p>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Video & Ambient Showcase */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl">
                <video
                  src="/videos/ambience.mp4"
                  poster="/images/publiq/interior/publiq-interior-hero.webp"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-transparent to-transparent opacity-60" />
                
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-[#070B12]/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#D4AF37]">LIVE AMBIENCE</span>
                    <h4 className="font-serif text-lg text-[#FDFBF7]">Evenings at PUBLIQ</h4>
                  </div>
                  <a
                    href="/reservations"
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-cinzel font-bold text-xs uppercase"
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
      <section id="gallery" className="py-24 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(7,11,18,0.96), rgba(5,8,14,0.94)), url('/images/publiq/backgrounds/bg-hero.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
              PHOTO &amp; VIDEO MOMENTS
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FDFBF7]">
              Moments at <span className="gold-shimmer">PUBLIQ</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1]">
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
                    ? "bg-[#D4AF37] text-[#070B12] font-bold shadow-md"
                    : "bg-[#0F1626] text-[#CBD5E1] hover:text-[#FDFBF7] border border-white/10"
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
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#D4AF37]/50 bg-[#0F1626] cursor-pointer h-60 sm:h-72"
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-transparent to-transparent opacity-0 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-[10px] font-cinzel text-[#D4AF37] uppercase tracking-widest">
                    {item.category}
                  </span>
                  <h4 className="font-serif text-sm sm:text-base text-[#FDFBF7] font-semibold">
                    {item.title}
                  </h4>
                  {item.caption && (
                    <p className="text-[11px] text-[#EDE8DC] mt-0.5">{item.caption}</p>
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
            <span className="text-xs font-cinzel uppercase tracking-[0.25em] !text-[#0284C7] font-bold" style={{ color: "#0284C7" }}>
              GUEST REVIEWS &amp; FEEDBACK
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold !text-[#0F172A]" style={{ color: "#0F172A" }}>
              What Our Guests <span className="bg-gradient-to-r from-[#B45309] to-[#D4AF37] bg-clip-text text-transparent">Love About Us</span>
            </h2>
            <p className="text-xs sm:text-sm !text-[#334155] font-medium" style={{ color: "#334155" }}>
              Real feedback from guests who have dined, celebrated birthdays, and spent evenings with us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={t.id || idx}
                className="p-8 rounded-2xl bg-white/95 border border-[#38BDF8]/40 flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="font-sans text-xs sm:text-sm !text-[#1E293B] leading-relaxed italic font-medium" style={{ color: "#1E293B" }}>
                    &ldquo;{t.review_text}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-serif font-bold !text-[#0F172A]" style={{ color: "#0F172A" }}>{t.customer_name}</h4>
                    <span className="text-[11px] !text-[#0284C7] font-semibold" style={{ color: "#0284C7" }}>{t.source || "Dine-In Guest"}</span>
                  </div>
                  <span className="text-[11px] !text-[#B45309] font-mono font-bold" style={{ color: "#B45309" }}>{t.review_date}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 9: PRIVATE EVENTS & BANQUET ENQUIRY FORM                          */}
      {/* ========================================================================= */}
      <section id="events" className="py-24 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(6,9,15,0.93), rgba(6,9,15,0.96)), url('/images/publiq/backgrounds/bg-private-dining.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 6 Cols: Event Offerings */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-cinzel uppercase tracking-[0.25em] text-[#D4AF37]">
                PARTIES &amp; PRIVATE CELEBRATIONS
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#FDFBF7] leading-tight">
                Host Your Special Party <br />
                <span className="gold-shimmer">at PUBLIQ</span>
              </h2>
              <p className="text-sm text-[#EDE8DC] font-sans leading-relaxed">
                Whether you are celebrating a birthday, anniversary, family get-together, or corporate dinner, our team handles everything from delicious custom menus to private dining seating.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#0F1626] border border-white/5">
                  <PartyPopper className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-[#FDFBF7]">Birthdays &amp; Parties</h4>
                  <p className="text-[11px] text-[#CBD5E1] mt-1">Custom food packages, party cakes &amp; music.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0F1626] border border-white/5">
                  <Award className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-[#FDFBF7]">Corporate Dinners</h4>
                  <p className="text-[11px] text-[#CBD5E1] mt-1">Private dining, GST billing &amp; drink packages.</p>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Connected Enquiry Form */}
            <div className="lg:col-span-6">
              <div className="p-8 sm:p-10 rounded-3xl bg-[#0F1626] border border-[#D4AF37]/30 shadow-2xl">
                <h3 className="font-serif text-2xl font-bold text-[#FDFBF7] mb-2">
                  Plan Your Event
                </h3>
                <p className="text-xs text-[#CBD5E1] mb-6">
                  Fill in your details and our restaurant team will call you back within 2 hours.
                </p>

                {eventSubmittedMsg ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs text-center space-y-3">
                    <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-sm">{eventSubmittedMsg}</p>
                    <button
                      onClick={() => setEventSubmittedMsg(null)}
                      className="px-4 py-1.5 rounded-full bg-emerald-800 text-white text-xs underline"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEventSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={eventFormData.name}
                          onChange={e => setEventFormData({ ...eventFormData, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
                          placeholder="Lord / Lady Hastings"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          required
                          value={eventFormData.phone}
                          onChange={e => setEventFormData({ ...eventFormData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
                          placeholder="+91 98000 00000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={eventFormData.email}
                          onChange={e => setEventFormData({ ...eventFormData, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
                          placeholder="guest@domain.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Event Type</label>
                        <select
                          value={eventFormData.event_type}
                          onChange={e => setEventFormData({ ...eventFormData, event_type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
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
                        <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Preferred Date</label>
                        <input
                          type="date"
                          required
                          value={eventFormData.date}
                          onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Guest Count</label>
                        <input
                          type="number"
                          min="2"
                          max="200"
                          value={eventFormData.guests}
                          onChange={e => setEventFormData({ ...eventFormData, guests: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-cinzel text-[#EDE8DC] uppercase tracking-wider mb-1">Special Requirements</label>
                      <textarea
                        rows={3}
                        value={eventFormData.requests}
                        onChange={e => setEventFormData({ ...eventFormData, requests: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-[#FDFBF7] text-xs focus:border-[#D4AF37] focus:outline-none"
                        placeholder="Dietary requests, champagne preferences, live music setup..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={eventSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-cinzel font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all cursor-pointer"
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
      {/* SECTION 10: DUAL ACTIONS (RESERVE TABLE & ORDER ONLINE)                    */}
      {/* ========================================================================= */}
      <section className="py-20 relative bg-cover bg-center border-b border-white/5" style={{ backgroundImage: "linear-gradient(to bottom, rgba(5,8,14,0.94), rgba(7,11,18,0.96)), url('/images/publiq/interior/publiq-interior-hero.webp')" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: Dine-In Reservation (Midnight Sapphire & Gold) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#08101E] to-[#040810] border border-[#38BDF8]/40 hover:border-[#38BDF8] flex flex-col justify-between space-y-6 shadow-2xl transition-all hover:-translate-y-1">
              <div>
                <span className="text-[10px] font-cinzel uppercase tracking-[0.25em] text-[#38BDF8] font-bold">
                  DINE-IN AT PUBLIQ
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1 mb-3">
                  Book Your Dining Table
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Reserve your favorite table in our central dining room, cocktail bar lounge, or outdoor rooftop terrace. Instant confirmation and zero wait times.
                </p>
              </div>

              <a
                href="/reservations"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-cinzel font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#D4AF37]/30"
              >
                <Calendar className="w-4 h-4" />
                <span>BOOK A TABLE NOW</span>
              </a>
            </div>

            {/* Card 2: Online Ordering (Crisp White & Light Blue Theme) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#FAFBFD] via-[#F0F7FF] to-[#E0F2FE] border border-[#BAE6FD] text-[#0F172A] flex flex-col justify-between space-y-6 shadow-2xl transition-all hover:-translate-y-1">
              <div>
                <span className="text-[10px] font-cinzel uppercase tracking-[0.25em] text-[#0284C7] font-bold">
                  DELIVERY &amp; TAKEAWAY
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1 mb-3">
                  Order Food to Your Doorstep
                </h3>
                <p className="text-xs text-[#334155] leading-relaxed">
                  Craving fresh food at home? Order our sizzling tandoori kebabs, rich butter chicken, and fragrant biryanis delivered hot and fresh right to your house.
                </p>
              </div>

              <a
                href="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-cinzel font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>ORDER FOOD ONLINE</span>
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
          className="group flex items-center gap-3 px-4 py-3 rounded-full bg-[#0F1626] border border-[#D4AF37]/50 text-[#FDFBF7] hover:text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] backdrop-blur-md transition-all cursor-pointer"
          title="Open AI Sommelier & Restaurant Concierge"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] flex items-center justify-center text-[#070B12]">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block font-cinzel text-[10px] uppercase tracking-wider text-[#D4AF37]">AI ASSISTANT</span>
            <span className="text-xs font-semibold text-[#FDFBF7]">Ask Menu Helper</span>
          </div>
        </button>
      </div>

      {/* AI SOMMELIER DRAWER */}
      {aiDrawerOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[420px] bg-[#070B12]/95 backdrop-blur-2xl border-r border-[#D4AF37]/30 shadow-2xl flex flex-col justify-between animate-fadeIn">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F1626] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#FDFBF7]">PUBLIQ Menu Assistant</h4>
                <span className="text-[10px] text-[#D4AF37] font-cinzel tracking-wider">AI FOOD &amp; DRINKS GUIDE</span>
              </div>
            </div>
            <button
              onClick={() => setAiDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-[#CBD5E1] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
            {aiMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-[#D4AF37] text-[#070B12] font-medium" 
                    : "bg-[#0F1626] text-[#EDE8DC] border border-white/10"
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex items-center gap-2 text-xs text-[#D4AF37] italic">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                <span>Checking menu dishes and chef recommendations...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleAiSend} className="p-4 border-t border-white/10 flex items-center gap-2 bg-[#05080E]">
            <input
              type="text"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask about dishes, recommendations, cocktails..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0F1626] border border-white/10 text-xs text-[#FDFBF7] focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="p-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C378] text-[#070B12] transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-[#0B111E] rounded-3xl overflow-hidden border border-[#D4AF37]/50 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-[#E5C378] hover:text-white border border-[#D4AF37]/30 text-xs font-cinzel font-semibold transition-colors flex items-center gap-1.5"
                title={isVideoMuted ? "Unmute Audio" : "Mute Audio"}
              >
                <span>{isVideoMuted ? "UNMUTE 🔊" : "MUTED 🔇"}</span>
              </button>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
                aria-label="Close Video Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
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
            <div className="p-6 bg-gradient-to-b from-[#0B111E] to-[#070B12] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-cinzel text-[#38BDF8] uppercase tracking-widest font-bold">
                  {activeModalVideo.category} • {activeModalVideo.tagline}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#FDFBF7] mt-1">
                  {activeModalVideo.title}
                </h3>
                <p className="text-xs text-[#E2E8F0] mt-1.5 leading-relaxed max-w-2xl font-medium">
                  {activeModalVideo.description}
                </p>
              </div>
              <a
                href="/reservations"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-cinzel font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center shrink-0"
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-2xl">
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white"
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
