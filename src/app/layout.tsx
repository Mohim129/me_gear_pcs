import type { Metadata } from "next";
import { Montserrat, Inter, Russo_One } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const russoOne = Russo_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MEG PCs - Build Your Dream Rig",
  description: "Custom built gaming PCs and workstation systems tailored to your needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable} ${russoOne.variable} h-full`}
    >
      <body className="antialiased min-h-screen bg-warm-cream">
        <div id="root" className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
