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
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#070B12] text-[#9DA3AE] font-sans antialiased selection:bg-[#D4AF37]/30 selection:text-[#FDFBF7]">
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
