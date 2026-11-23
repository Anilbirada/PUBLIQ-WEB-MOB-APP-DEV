import type { Metadata } from "next";
import "./globals.css";
import { TableSessionProvider } from "../context/TableSessionContext";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "PUBLIQ Bar & Restaurant — The Art of Gastronomy & Mixology",
  description: "Experience culinary alchemy, bespoke mixology, and sophisticated nightlife dining at PUBLIQ Bar & Restaurant. Reserve your table or order online.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-blue-600/20 selection:text-blue-900">
        <TableSessionProvider>
          <CartProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </AuthProvider>
          </CartProvider>
        </TableSessionProvider>
      </body>
    </html>
  );
}
