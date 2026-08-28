import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

// Self-hosted at build time. A Hebrew-first product cannot afford a
// render-blocking font request, and the fallback's metrics differ enough to
// shift every two-line clamp in the grid.
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "רשימת לידה",
  description: "רשימת לידה אחת, לכל החנויות.",
  // Registries are unlisted by design (PRD section 10).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FDFCFA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>{children}</body>
    </html>
  );
}
