"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, MessageSquareQuote, ChevronLeft, ChevronRight, User } from "lucide-react";

interface Review {
  _id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  productName?: string;
}

function ReviewSkeleton() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200/80 bg-white p-8 md:p-10 shadow-sm animate-pulse">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="h-10 w-10 text-gray-200"><MessageSquareQuote className="h-full w-full" /></div>
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-24 bg-gray-100 rounded w-full" />
        <div className="h-12 w-12 rounded-full bg-gray-100" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function TestimonialsCarousel() {
  const { data: reviews, isLoading, isError } = useQuery<Review[]>({
    queryKey: ["reviews", "top"],
    queryFn: async () => {
      const res = await fetch("/api/reviews?top=true&limit=5");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || !reviews || reviews.length === 0) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning, reviews]
  );

  const next = useCallback(() => {
    if (!reviews || reviews.length === 0) return;
    goTo((current + 1) % reviews.length);
  }, [current, goTo, reviews]);

  const prev = useCallback(() => {
    if (!reviews || reviews.length === 0) return;
    goTo((current - 1 + reviews.length) % reviews.length);
  }, [current, goTo, reviews]);

  // Auto-play testimonials
  useEffect(() => {
    if (!reviews || reviews.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, reviews]);

  if (isError) {
    toast.error("Failed to load reviews. Please try again later.");
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-warm-cream">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Read authentic reviews from gamers and professionals who trust MEG PCs
          </p>
        </div>

        {isLoading ? (
          <ReviewSkeleton />
        ) : !reviews || reviews.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200/80 bg-white p-10 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <MessageSquareQuote className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500 text-lg font-medium">No reviews yet.</p>
              <p className="text-gray-400 text-sm">Be the first to share your experience with our products!</p>
            </div>
          </div>
        ) : (
          <div className="relative mx-auto max-w-3xl">
            {/* Carousel Track */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-8 md:p-12 shadow-sm">
              {reviews.map((review, i) => (
                <div
                  key={review._id}
                  className={`transition-all duration-500 ease-in-out ${
                    i === current
                      ? "block opacity-100 translate-y-0"
                      : "hidden opacity-0 translate-y-4"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Quote Icon */}
                    <div className="text-rust-copper/20 mb-6">
                      <MessageSquareQuote className="h-12 w-12 fill-current" />
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className={`h-5 w-5 ${
                            starIndex < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <blockquote className="text-slate-900 dark:text-zinc-100 font-medium text-base md:text-lg leading-relaxed mb-6 italic">
                      "{review.comment}"
                    </blockquote>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      {review.userAvatar ? (
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="h-12 w-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-gray-200">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                      <div className="text-left">
                        <cite className="font-heading font-semibold text-slate-900 dark:text-zinc-100 not-italic text-sm md:text-base block">
                          {review.userName}
                        </cite>
                        {review.productName && (
                          <span className="text-xs text-rust-copper font-medium">
                            Verified buyer of: {review.productName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Navigation */}
            {reviews.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-900 dark:text-zinc-100 shadow-md transition-all hover:scale-105"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-900 dark:text-zinc-100 shadow-md transition-all hover:scale-105"
                  aria-label="Next review"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dot Navigation */}
                <div className="flex justify-center gap-2 mt-6">
                  {reviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i === current
                          ? "w-6 bg-rust-copper"
                          : "bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
