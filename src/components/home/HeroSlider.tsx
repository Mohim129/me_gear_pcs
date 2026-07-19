"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  id: number;
  image?: string;
  headline: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  bgClass?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: "https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg",
    headline: "Ultimate Performance",
    subtitle: "Experience unmatched power with our custom-built gaming PCs. Engineered for the most demanding games and creative workflows.",
    cta: "Shop Now",
    ctaLink: "/products",
  },
  {
    id: 2,
    image: "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
    headline: "Next-Gen Components",
    subtitle: "From cutting-edge GPUs to blazing-fast SSDs, we stock only the finest hardware from top brands worldwide.",
    cta: "Shop Now",
    ctaLink: "/products",
  },
  {
    id: 3,
    headline: "Build Your Dream PC",
    subtitle: "Use our interactive PC Builder to craft a machine that matches your exact needs. Every part, hand-picked by you.",
    cta: "Start Building",
    ctaLink: "/builder",
    bgClass: "bg-gradient-to-br from-slate-gray via-[#1a2a3a] to-[#0d1b2a]",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          } ${slide.bgClass || ""}`}
        >
          {/* Background Image */}
          {slide.image && (
            <Image
              src={slide.image}
              alt={slide.headline}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 z-10" />

          {/* Content */}
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 sm:px-8">
            <h1
              className={`font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 max-w-4xl leading-tight transition-transform duration-700 ${
                i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              {slide.headline}
            </h1>
            <p
              className={`text-gray-200 text-sm sm:text-base md:text-lg max-w-2xl mb-6 md:mb-8 leading-relaxed transition-transform duration-700 delay-100 ${
                i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              {slide.subtitle}
            </p>
            <Link
              href={slide.ctaLink}
              className={`inline-flex items-center px-6 py-3 md:px-8 md:py-3.5 bg-rust-copper hover:bg-rust-copper/90 text-white font-heading font-semibold text-sm md:text-base rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-rust-copper/30 ${
                i === current ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              {slide.cta}
            </Link>
          </div>
        </div>
      ))}

      {/* Arrow Navigation */}
      <button
        onClick={prev}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 h-3 bg-rust-copper"
                : "w-3 h-3 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
