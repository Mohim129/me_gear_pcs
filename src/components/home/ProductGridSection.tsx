"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PackageOpen } from "lucide-react";
import ProductCard, { type Product } from "./ProductCard";

interface ProductGridProps {
  title: string;
  subtitle?: string;
  sort: string;
  limit: number;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200/60 bg-white overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-100 rounded w-1/3" />
        <div className="h-9 bg-gray-100 rounded w-full mt-2" />
      </div>
    </div>
  );
}

export default function ProductGridSection({ title, subtitle, sort, limit }: ProductGridProps) {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products", sort, limit],
    queryFn: async () => {
      const res = await fetch(`/api/products?sort=${sort}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  if (isError) {
    toast.error("Failed to load products. Please try again later.");
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 max-w-xl mx-auto">{subtitle}</p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <PackageOpen className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500 text-lg">No products found yet.</p>
            <p className="text-gray-400 text-sm">Our inventory is being updated. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
