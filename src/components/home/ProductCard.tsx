"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingBag } from "lucide-react";

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: { name: string; slug: string };
  brand?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
      {/* Badge */}
      {discount > 0 && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-rust-copper px-2.5 py-1 text-xs font-bold text-white">
          -{discount}%
        </span>
      )}

      {/* Image */}
      <Link href={`/products/${product._id}`} className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-xs font-medium text-rust-copper uppercase tracking-wider mb-1">
            {product.category.name}
          </span>
        )}

        <Link href={`/products/${product._id}`}>
          <h3 className="font-heading font-semibold text-slate-900 dark:text-zinc-100 text-sm md:text-base line-clamp-2 hover:text-rust-copper transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
            {product.description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < Math.round(product.rating || 0)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          {product.reviewCount !== undefined && (
            <span className="text-xs text-gray-400 ml-1">({product.reviewCount})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="font-heading font-bold text-slate-900 dark:text-zinc-100 text-lg">
            ৳{product.price.toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              ৳{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/products/${product._id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-slate-gray px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rust-copper"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
