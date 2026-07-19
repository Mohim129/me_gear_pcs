"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Custom SVG Icons for social media brands
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing, ${email}!`);
      setEmail("");
    }
  };

  const socialLinks = [
    { icon: <FacebookIcon />, href: "https://facebook.com", label: "Facebook" },
    { icon: <InstagramIcon />, href: "https://instagram.com", label: "Instagram" },
    { icon: <TwitterIcon />, href: "https://twitter.com", label: "Twitter" },
    { icon: <YoutubeIcon />, href: "https://youtube.com", label: "YouTube" },
  ];

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/products" },
    { name: "PC Builder", href: "/builder" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  const supportLinks = [
    { name: "FAQs", href: "#faq" },
    { name: "Shipping Info", href: "#shipping" },
    { name: "Returns & Exchanges", href: "#returns" },
    { name: "Warranty Policies", href: "#warranty" },
    { name: "Track Order", href: "#track" },
  ];

  return (
    <footer className="bg-slate-gray text-white border-t border-slate-700/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 text-center md:text-left">
          {/* Column 1: Brand & Socials */}
          <div className="space-y-6 flex flex-col items-center md:items-start">
            <Link href="/" className="inline-block">
              <span className="font-logo text-3xl font-bold tracking-wider text-warm-cream">
                MEG PCS
              </span>
            </Link>
            <p className="text-gray-300 text-sm max-w-xs leading-relaxed">
              Build your dream gaming rig or workspace powerhouse. High performance PCs customized just for you.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-slate-700/50 hover:bg-rust-copper text-gray-300 hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-warm-cream tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-rust-copper text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-warm-cream tracking-wide">
              Support
            </h3>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-rust-copper text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <h3 className="font-heading text-lg font-semibold text-warm-cream tracking-wide">
              Stay Updated
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs text-center md:text-left">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form onSubmit={handleSubscribe} className="w-full max-w-sm space-y-2">
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-md border-0 bg-slate-700/40 py-2.5 pl-4 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rust-copper transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-rust-copper hover:bg-rust-copper/90 rounded text-white flex items-center justify-center transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-700/60 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} MEG PCs. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#privacy" className="hover:text-rust-copper transition-colors">Privacy Policy</Link>
            <Link href="#terms" className="hover:text-rust-copper transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
