"use client";

import React, { useState, useEffect } from "react";
import { 
  Star, MessageSquare, ThumbsUp, ShieldCheck, 
  RefreshCw, CheckCircle2, Eye, EyeOff, Search,
  Utensils, Wine, Award, Filter, ArrowLeft
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Review {
  id: string;
  order_id?: string;
  table_number?: string;
  customer_name: string;
  overall_rating: number;
  food_rating: number;
  drinks_rating: number;
  service_rating: number;
  comment: string;
  is_published: boolean;
  is_moderated: boolean;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [metrics, setMetrics] = useState<any>({
    average_overall: 4.9,
    average_food: 4.9,
    average_drinks: 4.8,
    average_service: 4.9,
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews?published_only=false&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.metrics) setMetrics(data.metrics);
        setTotalCount(data.total_reviews || (data.reviews || []).length);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleTogglePublish = async (reviewId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/moderate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !currentPublished, is_moderated: true }),
      });
      if (res.ok) {
        setReviews(prev =>
          prev.map(r => r.id === reviewId ? { ...r, is_published: !currentPublished, is_moderated: true } : r)
        );
      }
    } catch (e) {
      console.error("Moderation toggle failed:", e);
    }
  };

  const filtered = reviews.filter(r => {
    if (ratingFilter && r.overall_rating !== ratingFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = (r.customer_name || "").toLowerCase().includes(q);
      const matchComment = (r.comment || "").toLowerCase().includes(q);
      const matchTable = (r.table_number || "").toLowerCase().includes(q);
      if (!matchName && !matchComment && !matchTable) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 p-6 lg:p-10 selection:bg-[#D4AF37] selection:text-[#070B12]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="p-2.5 rounded-full bg-[#0A111F] hover:bg-[#0F1626] border border-[#D4AF37]/30 text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span>CUSTOMER REPUTATION &amp; QUALITY ASSURANCE</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white mt-1">
                Customer Reviews &amp; Ratings
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time verified dining reviews from table QR scans and digital order settlements.
              </p>
            </div>
          </div>

          <button
            onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1626] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] hover:bg-[#151F33] transition-colors shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Reviews</span>
          </button>
        </div>

        {/* Rating Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0A111F] rounded-2xl p-5 border border-[#D4AF37]/30 shadow-xl bg-gradient-to-br from-[#0A111F] to-[#161D2B]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">OVERALL RATING</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-bold text-white">{metrics.average_overall}</span>
              <div className="flex text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">{totalCount} Verified Reviews</span>
          </div>

          <div className="bg-[#0A111F] rounded-2xl p-5 border border-slate-800 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" /> FOOD EXPERIENCE
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-bold text-white">{metrics.average_food}</span>
              <span className="text-xs text-amber-400 font-bold">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">Kitchen &amp; Tandoor Quality</span>
          </div>

          <div className="bg-[#0A111F] rounded-2xl p-5 border border-slate-800 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
              <Wine className="w-3.5 h-3.5 text-sky-400" /> DRINKS &amp; BAR
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-bold text-white">{metrics.average_drinks}</span>
              <span className="text-xs text-sky-400 font-bold">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">Mixology &amp; Single Malts</span>
          </div>

          <div className="bg-[#0A111F] rounded-2xl p-5 border border-slate-800 shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> STEWARD SERVICE
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-bold text-white">{metrics.average_service}</span>
              <span className="text-xs text-emerald-400 font-bold">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">Hospitality &amp; Speed</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0A111F] p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by customer, comment, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#070B12] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                ratingFilter === null ? "bg-[#D4AF37] text-[#070B12]" : "bg-[#070B12] text-slate-400 border border-slate-800"
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map((stars) => (
              <button
                key={stars}
                onClick={() => setRatingFilter(stars)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  ratingFilter === stars ? "bg-[#D4AF37] text-[#070B12]" : "bg-[#070B12] text-slate-400 border border-slate-800"
                }`}
              >
                <span>{stars}</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading guest reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#0A111F] rounded-3xl border border-slate-800 p-8 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-serif text-lg text-white">No Reviews Found</h3>
            <p className="text-xs text-slate-400">Customer feedback submitted from table track pages will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#0A111F] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                        <span>{rev.customer_name}</span>
                        {rev.table_number && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                            Table {rev.table_number}
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {rev.created_at ? new Date(rev.created_at).toLocaleString("en-IN") : "Recent"}
                      </span>
                    </div>

                    <div className="flex text-[#D4AF37]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.overall_rating ? "fill-[#D4AF37]" : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-300 italic bg-[#070B12] p-3.5 rounded-xl border border-slate-800/80">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}

                  {/* Sub-ratings */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                    <span>Food: <strong className="text-amber-400">{rev.food_rating}/5</strong></span>
                    <span>Drinks: <strong className="text-sky-400">{rev.drinks_rating}/5</strong></span>
                    <span>Service: <strong className="text-emerald-400">{rev.service_rating}/5</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    rev.is_published ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}>
                    {rev.is_published ? "Published Live" : "Hidden from Public"}
                  </span>

                  <button
                    onClick={() => handleTogglePublish(rev.id, rev.is_published)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {rev.is_published ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
