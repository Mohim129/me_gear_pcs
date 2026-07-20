"use client";

import React from "react";
import Link from "next/link";
import {
  Cpu,
  MonitorSmartphone,
  HardDrive,
  MemoryStick,
  Box,
  Zap,
  Fan,
  Thermometer,
  Keyboard,
  Mouse,
  Headphones,
  Speaker,
  Laptop,
  Package,
  CircuitBoard,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

const iconMap: Record<string, React.ReactNode> = {
  cpu: <Cpu className="h-7 w-7" />,
  gpu: <CircuitBoard className="h-7 w-7" />,
  motherboard: <HardDrive className="h-7 w-7" />,
  ram: <MemoryStick className="h-7 w-7" />,
  storage: <HardDrive className="h-7 w-7" />,
  psu: <Zap className="h-7 w-7" />,
  casing: <Box className="h-7 w-7" />,
  cooler: <Fan className="h-7 w-7" />,
  monitor: <MonitorSmartphone className="h-7 w-7" />,
  keyboard: <Keyboard className="h-7 w-7" />,
  mouse: <Mouse className="h-7 w-7" />,
  headphone: <Headphones className="h-7 w-7" />,
  speaker: <Speaker className="h-7 w-7" />,
  "pre-built-pc": <Package className="h-7 w-7" />,
  laptop: <Laptop className="h-7 w-7" />,
};

// Assign bento grid sizes: make certain categories "featured" (larger)
const featuredSlugs = ["gpu", "cpu", "pre-built-pc", "laptop"];

export default function CategoriesGrid({ categories }: { categories: Category[] }) {
  if (!categories || categories.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-4">
            Shop by Category
          </h2>
          <div className="mt-12 flex flex-col items-center gap-4">
            <Thermometer className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500 text-lg">No categories available yet.</p>
            <p className="text-gray-400 text-sm">Check back soon for our product categories!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
            Shop by Category
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Find exactly what you need for your dream build
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {categories.map((cat) => {
            const isFeatured = featuredSlugs.includes(cat.slug);
            return (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-6 text-center transition-all duration-300 hover:border-rust-copper/40 hover:shadow-lg hover:shadow-rust-copper/5 hover:-translate-y-1 ${
                  isFeatured
                    ? "sm:col-span-2 sm:row-span-2 p-8 md:p-10"
                    : ""
                }`}
              >
                <div className={`mb-3 flex items-center justify-center rounded-xl bg-warm-cream p-3 text-slate-900 dark:text-zinc-100 transition-colors group-hover:bg-rust-copper/10 group-hover:text-rust-copper ${isFeatured ? "p-4 mb-4" : ""}`}>
                  {iconMap[cat.slug] || <Box className="h-7 w-7" />}
                </div>
                <span className={`font-heading font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-rust-copper transition-colors ${isFeatured ? "text-lg md:text-xl" : "text-sm md:text-base"}`}>
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
