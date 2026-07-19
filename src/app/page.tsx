import React from "react";
import { connectToDatabase } from "@/lib/db";
import HeroSlider from "@/components/home/HeroSlider";
import CategoriesGrid from "@/components/home/CategoriesGrid";
import ProductGridSection from "@/components/home/ProductGridSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsBar from "@/components/home/StatsBar";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import NewsletterFaq from "@/components/home/NewsletterFaq";

export const revalidate = 60; // revalidate every minute

export default async function Home() {
  let categories: any[] = [];

  try {
    const { db } = await connectToDatabase();
    const rawCategories = await db
      .collection("categories")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    categories = rawCategories.map((cat) => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    }));
  } catch (error) {
    console.error("Failed to load categories in homepage server component:", error);
  }

  return (
    <div className="flex flex-col w-full bg-warm-cream">
      {/* 1. Hero Slider */}
      <HeroSlider />

      {/* 2. Categories Bento-Grid */}
      <CategoriesGrid categories={categories} />

      {/* 3. New Arrivals */}
      <ProductGridSection
        title="New Arrivals"
        subtitle="Check out our latest powerhouses and premium components just added to the store"
        sort="newest"
        limit={4}
      />

      {/* 4. Best Sellers */}
      <ProductGridSection
        title="Best Sellers"
        subtitle="The highest-rated gear and components favored by our community of builders"
        sort="rating"
        limit={4}
      />

      {/* 5. Features Section */}
      <FeaturesSection />

      {/* 6. Statistics Bar */}
      <StatsBar />

      {/* 7. Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* 8. Newsletter & FAQ */}
      <NewsletterFaq />
    </div>
  );
}
