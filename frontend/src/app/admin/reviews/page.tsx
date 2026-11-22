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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 lg:p-10 font-sans selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </a>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Award className="w-4 h-4 text-blue-600" />
                <span>CUSTOMER REPUTATION & QUALITY ASSURANCE</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Customer Reviews & Ratings
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Real-time verified dining reviews from table QR scans and digital order settlements.
              </p>
            </div>
          </div>

          <button
            onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Refresh Reviews</span>
          </button>
        </div>

        {/* Rating Metrics Cards (Pure White Cards with Multicolour Accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">OVERALL RATING</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-black text-slate-900">{metrics.average_overall}</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-2 block">{totalCount} Verified Reviews</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-600" /> FOOD EXPERIENCE
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-black text-slate-900">{metrics.average_food}</span>
              <span className="text-xs text-amber-700 font-bold">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-2 block">Kitchen & Tandoor Quality</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 block flex items-center gap-1.5">
              <Wine className="w-3.5 h-3.5 text-cyan-600" /> DRINKS & BAR
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-black text-slate-900">{metrics.average_drinks}</span>
              <span className="text-xs text-cyan-700 font-bold">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-2 block">Mixology & Single Malts</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> STEWARD SERVICE
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-serif text-3xl font-black text-slate-900">{metrics.average_service}</span>
              <span className="text-xs text-emerald-700 font-bold">/ 5.0</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-2 block">Hospitality & Speed</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by customer, comment, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                ratingFilter === null ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 border border-slate-200"
              }`}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map((stars) => (
              <button
                key={stars}
                onClick={() => setRatingFilter(stars)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  ratingFilter === stars ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 border border-slate-200"
                }`}
              >
                <span>{stars}</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List (Pure White Cards) */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading guest reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-3 shadow-xs">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-slate-900">No Reviews Found</h3>
            <p className="text-xs text-slate-500">Customer feedback submitted from table track pages will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{rev.customer_name}</span>
                        {rev.table_number && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                            Table {rev.table_number}
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {rev.created_at ? new Date(rev.created_at).toLocaleString("en-IN") : "Recent"}
                      </span>
                    </div>

                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.overall_rating ? "fill-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}

                  {/* Sub-ratings */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 font-medium">
                    <span>Food: <strong className="text-amber-700 font-bold">{rev.food_rating}/5</strong></span>
                    <span>Drinks: <strong className="text-blue-700 font-bold">{rev.drinks_rating}/5</strong></span>
                    <span>Service: <strong className="text-emerald-700 font-bold">{rev.service_rating}/5</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    rev.is_published ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {rev.is_published ? "Published Live" : "Hidden from Public"}
                  </span>

                  <button
                    onClick={() => handleTogglePublish(rev.id, rev.is_published)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {rev.is_published ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
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
