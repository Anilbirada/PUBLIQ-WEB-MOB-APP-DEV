"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Wine, UtensilsCrossed, ShieldCheck 
} from "lucide-react";
import { api } from "../../../lib/api";
import { useTableSession } from "../../../context/TableSessionContext";

export default function OrderTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { setTableSession } = useTableSession();

  const [status, setStatus] = useState<"VALIDATING" | "SUCCESS" | "ERROR">("VALIDATING");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [tableData, setTableData] = useState<any>(null);

  const rawToken = Array.isArray(params?.token) ? params.token[0] : (params?.token as string);

  useEffect(() => {
    async function processQrScan() {
      if (!rawToken) {
        setStatus("ERROR");
        setErrorMessage("No table scan token provided.");
        return;
      }

      try {
        // Strip out any accidental prefix
        const tokenToValidate = rawToken.replace(/^table-/, "");

        // 1. Validate QR Token with Backend API
        const res = await api.validateQrToken(tokenToValidate);

        if (!res.is_valid) {
          setStatus("ERROR");
          setErrorMessage(res.message || "Invalid or expired table QR code.");
          return;
        }

        setTableData(res);

        // 2. Hydrate global TableSessionContext
        setTableSession({
          tableNumber: res.table_number,
          tableId: res.table_id,
          outletId: res.outlet_id,
          outletName: res.outlet_name,
          outletCode: res.outlet_code,
          diningArea: res.dining_area,
          sessionToken: res.session_token,
          alcoholServiceEnabled: res.alcohol_service_enabled,
          legalDrinkingAge: res.legal_drinking_age,
          isDineInActive: true,
        });

        // 3. Native App Deep Link Interception Attempt
        // If user has the app installed, custom scheme triggers native intent.
        // If not installed, page cleanly remains on responsive web app.
        const deepLinkUrl = `publiq://order/${tokenToValidate}`;
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = deepLinkUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (_) {}
        }, 1500);

        // Transition to success state
        setStatus("SUCCESS");
      } catch (err: any) {
        setStatus("ERROR");
        setErrorMessage(err.message || "Failed to validate QR code. Please ask floor staff.");
      }
    }

    processQrScan();
  }, [rawToken, setTableSession]);

  const proceedToMenu = () => {
    router.push("/menu");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#070B12]">
      <div className="max-w-md w-full bg-[#0A111F] rounded-3xl shadow-2xl border border-[#D4AF37]/30 p-6 sm:p-8 text-center space-y-6 text-slate-100">
        {/* Brand Crest with Official Logo */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#0F1626] p-2 border-2 border-[#D4AF37]/50 flex items-center justify-center shadow-lg">
          <img src="/logo.png?v=4" alt="PUBLIQ" className="w-full h-full object-contain" />
        </div>

        {status === "VALIDATING" && (
          <div className="space-y-4 py-6">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="font-serif text-2xl font-normal text-white">
              Connecting to Table...
            </h2>
            <p className="text-xs text-slate-300">
              Connecting your table session to the digital menu...
            </p>
          </div>
        )}

        {status === "ERROR" && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-normal text-rose-300">
              QR Verification Failed
            </h2>
            <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
              {errorMessage}
            </p>
            <p className="text-xs text-slate-400">
              Please ensure you are scanning an active table QR code placed inside PUBLIQ Bar & Restaurant.
            </p>
            <a
              href="/menu"
              className="inline-block py-3 px-6 rounded-2xl bg-[#D4AF37] text-[#070B12] font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#E5C378] transition-colors"
            >
              View Menu &amp; Order
            </a>
          </div>
        )}

        {status === "SUCCESS" && tableData && (
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1626] text-emerald-400 text-xs font-bold border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Table Verified & Connected</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] block">
                WELCOME TO PUBLIQ
              </span>
              <h2 className="font-serif text-3xl font-normal text-white mt-1">
                Table {tableData.table_number}
              </h2>
              <div className="mt-2 text-xs text-slate-400 font-medium space-y-0.5">
                <span className="block font-bold text-white">{tableData.outlet_name}</span>
                <span className="inline-block px-3 py-0.5 rounded-full bg-[#070B12] border border-[#D4AF37]/30 text-[#D4AF37] font-semibold text-[11px] mt-1">
                  Section: {tableData.dining_area}
                </span>
              </div>
            </div>

            {/* Smart App Detection / Web Ordering Notice */}
            <div className="bg-[#070B12] rounded-2xl p-4 border border-[#D4AF37]/20 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Zero-Download Instant Table Ordering</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Enjoy full digital dining from your phone. Select items, customize dishes, and order directly to our kitchen & bar!
              </p>
            </div>

            <button
              onClick={proceedToMenu}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38728] text-[#070B12] hover:opacity-95 font-bold text-xs tracking-widest uppercase transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
            >
              <span>Explore Digital Menu & Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
