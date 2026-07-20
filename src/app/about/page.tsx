import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Monitor,
  Cpu,
  ShieldCheck,
  Truck,
  Users,
  Award,
  Factory,
  Zap,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden mb-12">
        <Image
          src="https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"
          alt="MEG PCs Workshop"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
          <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight mb-2">
            OUR STORY
          </h1>
          <p className="max-w-xl text-sm sm:text-base text-gray-200">
            Building Bangladesh&apos;s most trusted custom PC destination since
            2020.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold font-heading text-slate-gray mb-3">
          The Vision
        </h2>
        <div className="w-20 h-1 bg-rust-copper mx-auto mb-6 rounded-full" />
        <p className="max-w-3xl mx-auto text-gray-600 leading-relaxed">
          MEG PCs was born from a simple belief: every Bangladeshi gamer,
          creator, and professional deserves a high‑performance machine built
          with precision, transparency, and care. We combine deep hardware
          expertise with a passion for PC building to deliver rigs that are as
          unique as the people who use them.
        </p>
      </div>

      {/* Bento Grid: Image + Features */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16">
        {/* Left large image */}
        <div className="lg:col-span-3 relative h-72 sm:h-96 rounded-2xl overflow-hidden">
          <Image
            src="https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"
            alt="PC Building Station"
            fill
            className="object-cover"
          />
        </div>

        {/* Right cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-rust-copper/10 rounded-full flex items-center justify-center mb-3">
              <Factory className="h-6 w-6 text-rust-copper" />
            </div>
            <h4 className="font-bold text-slate-gray">Precision Assembly</h4>
            <p className="text-xs text-gray-500 mt-1">
              Every cable routed, every screw torqued to spec.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-rust-copper/10 rounded-full flex items-center justify-center mb-3">
              <Award className="h-6 w-6 text-rust-copper" />
            </div>
            <h4 className="font-bold text-slate-gray">Heritage & Quality</h4>
            <p className="text-xs text-gray-500 mt-1">
              Only genuine, warrantied components from authorized distributors.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-rust-copper/10 rounded-full flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-rust-copper" />
            </div>
            <h4 className="font-bold text-slate-gray">Modern Craftsmanship</h4>
            <p className="text-xs text-gray-500 mt-1">
              Custom water cooling, RGB integration, and silent tuning.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-rust-copper/10 rounded-full flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-rust-copper" />
            </div>
            <h4 className="font-bold text-slate-gray">Community First</h4>
            <p className="text-xs text-gray-500 mt-1">
              Free build consultations and 24/7 local support in Dhaka.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { value: "5,000+", label: "Builds Completed" },
          { value: "10,000+", label: "Happy Customers" },
          { value: "15+", label: "Expert Technicians" },
          { value: "100%", label: "Authentic Parts" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 text-center shadow-sm"
          >
            <p className="text-3xl font-black font-heading text-rust-copper">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-rust-copper rounded-3xl p-8 sm:p-12 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-3">
          Ready to Build Your Dream PC?
        </h2>
        <p className="text-white/80 text-sm max-w-lg mx-auto mb-6">
          Use our intelligent PC Builder to hand‑pick every component, or browse
          our pre‑tested, ready‑to‑ship rigs.
        </p>
        <Link
          href="/pc-builder"
          className="inline-flex items-center gap-2 bg-white text-rust-copper font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-lg"
        >
          <Monitor className="h-5 w-5" />
          Launch PC Builder
        </Link>
      </div>
    </div>
  );
}
