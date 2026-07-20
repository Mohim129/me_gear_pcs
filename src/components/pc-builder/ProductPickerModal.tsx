"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Check, ShieldAlert } from "lucide-react";
import { getCompatibleProducts, Product } from "@/lib/compatibility";

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug: string;
  categoryName: string;
  currentBuild: Record<string, Product>;
  onSelect: (product: Product) => void;
}

export default function ProductPickerModal({
  isOpen,
  onClose,
  categorySlug,
  categoryName,
  currentBuild,
  onSelect,
}: ProductPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allProducts, isLoading, error } = useQuery<Product[]>({
    queryKey: ["products", "picker", categorySlug],
    queryFn: async () => {
      const res = await fetch(`/api/products?category=${categorySlug}&limit=100`);
      if (!res.ok) throw new Error("Failed to load products for category");
      return res.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Filter compatible products
  const compatibleProducts = allProducts
    ? getCompatibleProducts(categorySlug, allProducts, currentBuild)
    : [];

  // Apply search query
  const filteredProducts = compatibleProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-zinc-100">
              Select {categoryName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose a compatible component to add to your build
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${categoryName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-850 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border border-gray-100 dark:border-zinc-800 rounded-2xl animate-pulse">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
              <h4 className="text-lg font-semibold text-slate-900 dark:text-zinc-200">Failed to load components</h4>
              <p className="text-sm text-gray-500 max-w-xs mt-1">
                There was an error communicating with the database. Please try again.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold font-heading text-slate-900 dark:text-zinc-200">No compatible parts found</h4>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                {searchQuery
                  ? "Try checking your spelling or search terms."
                  : "Try clearing existing CPU, motherboard, or case selections to open up more compatibility choices."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const specEntries = Object.entries(product.specifications || {}).slice(0, 3);
                return (
                  <div
                    key={product._id}
                    className="flex gap-4 p-4 border border-gray-150 dark:border-zinc-800/80 hover:border-rust-copper/50 rounded-2xl bg-white dark:bg-zinc-850 shadow-sm hover:shadow transition-all group duration-300"
                  >
                    {/* Image */}
                    <div className="relative w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={product.image || "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1 transform group-hover:scale-105 transition-transform duration-350"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                          {product.brand}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-rust-copper transition-colors">
                          {product.name}
                        </h4>
                        
                        {/* Specs snippets */}
                        {specEntries.length > 0 && (
                          <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1 text-[11px] text-gray-500">
                            {specEntries.map(([key, val]) => (
                              <span key={key} className="bg-gray-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-zinc-700/50">
                                <span className="font-semibold text-gray-600 dark:text-zinc-400 capitalize">{key.replace("_", " ")}:</span> {Array.isArray(val) ? val.join("/") : val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-zinc-800/50">
                        <span className="text-sm font-bold text-rust-copper">
                          {product.price.toLocaleString()} BDT
                        </span>
                        <button
                          onClick={() => {
                            onSelect(product);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 bg-rust-copper hover:bg-rust-copper/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Add Component
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
