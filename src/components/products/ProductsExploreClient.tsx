"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Inbox,
  FilterX
} from "lucide-react";
import ProductCard, { type Product } from "@/components/home/ProductCard";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface PaginatedProductsResponse {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

function ProductSkeleton() {
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

export default function ProductsExploreClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL QUERY STATE SYNC ──
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const rating = searchParams.get("rating") || "0";
  const categoriesParam = searchParams.get("categories") || "";
  
  const selectedCategories = categoriesParam ? categoriesParam.split(",") : [];

  // Local inputs (for debouncing or non-instant state changes)
  const [searchInput, setSearchInput] = useState(search);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync local states if query params change externally
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setMinPriceInput(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setMaxPriceInput(maxPrice);
  }, [maxPrice]);

  // Update query params function
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 when changing filters, unless page is explicitly updated
    if (!updates.hasOwnProperty("page")) {
      params.set("page", "1");
    }

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput !== search) {
        updateQuery({ search: searchInput });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Fetch products
  const { data: productData, isLoading, isError } = useQuery<PaginatedProductsResponse>({
    queryKey: ["products", sort, page, search, minPrice, maxPrice, rating, categoriesParam],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        sort,
        page: page.toString(),
        limit: "12",
        search,
        minPrice: minPrice || "0",
        maxPrice: maxPrice || "9999999",
        rating,
        categories: categoriesParam,
        format: "paginated",
      });

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  if (isError) {
    toast.error("Failed to load products. Please reload the page.");
  }

  const handleCategoryCheckbox = (slug: string, checked: boolean) => {
    let nextCats = [...selectedCategories];
    if (checked) {
      if (!nextCats.includes(slug)) nextCats.push(slug);
    } else {
      nextCats = nextCats.filter((c) => c !== slug);
    }
    updateQuery({ categories: nextCats.length > 0 ? nextCats.join(",") : null });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({
      minPrice: minPriceInput || null,
      maxPrice: maxPriceInput || null,
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/products");
    toast.success("Filters cleared");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-gray">
            Explore Hardware
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Build, upgrade, and conquer with our components
          </p>
        </div>

        {/* Search and Sort Wrapper */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-grow md:w-64">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search components..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Sort Selector */}
          <select
            value={sort}
            onChange={(e) => updateQuery({ sort: e.target.value })}
            className="rounded-xl border border-gray-300 bg-white py-2.5 px-3 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300 cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* Mobile Filter Trigger Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden flex items-center justify-center p-2.5 rounded-xl border border-gray-300 bg-white text-slate-gray hover:bg-gray-50 active:scale-[0.98]"
            title="Filter options"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Product Grid */}
      <div className="flex items-start gap-8">
        
        {/* SIDEBAR FILTERS (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border border-gray-200/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="font-heading font-bold text-slate-gray flex items-center gap-2">
              <Sliders className="h-4 w-4 text-rust-copper" />
              Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rust-copper hover:underline flex items-center gap-1.5 focus:outline-none"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-gray uppercase tracking-wider">
              Categories
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {categories?.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2 text-sm text-gray-600 hover:text-slate-gray cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={(e) => handleCategoryCheckbox(cat.slug, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-rust-copper focus:ring-rust-copper/50 cursor-pointer"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3 border-t border-gray-100 pt-5">
            <h4 className="text-xs font-bold text-slate-gray uppercase tracking-wider">
              Price Range (BDT)
            </h4>
            <form onSubmit={handlePriceApply} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/30 transition-all"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-rust-copper/10 text-rust-copper hover:bg-rust-copper hover:text-white py-1.5 text-xs font-semibold transition-all"
              >
                Apply Price
              </button>
            </form>
          </div>

          {/* Rating */}
          <div className="space-y-3 border-t border-gray-100 pt-5">
            <h4 className="text-xs font-bold text-slate-gray uppercase tracking-wider">
              Minimum Rating
            </h4>
            <div className="space-y-2.5">
              {[
                { label: "4★ & up", val: "4" },
                { label: "3★ & up", val: "3" },
                { label: "2★ & up", val: "2" },
                { label: "Any Rating", val: "0" },
              ].map((r) => (
                <label key={r.val} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-slate-gray cursor-pointer select-none">
                  <input
                    type="radio"
                    name="rating"
                    checked={rating === r.val}
                    onChange={() => updateQuery({ rating: r.val === "0" ? null : r.val })}
                    className="h-4 w-4 border-gray-300 text-rust-copper focus:ring-rust-copper/50 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    {r.val !== "0" && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER FILTERS */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsFilterOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-80 max-w-[85vw] bg-white h-full p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto animate-slide-in-right z-10">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="font-heading font-bold text-slate-gray flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-rust-copper" />
                  Filters
                </h3>
                <button
                  onClick={() => {
                    clearFilters();
                    setIsFilterOpen(false);
                  }}
                  className="text-xs font-semibold text-rust-copper hover:underline flex items-center gap-1.5 focus:outline-none"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-gray uppercase tracking-wider">
                  Categories
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categories?.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-2 text-sm text-gray-600 hover:text-slate-gray cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.slug)}
                        onChange={(e) => handleCategoryCheckbox(cat.slug, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-rust-copper focus:ring-rust-copper/50 cursor-pointer"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3 border-t border-gray-100 pt-5">
                <h4 className="text-xs font-bold text-slate-gray uppercase tracking-wider">
                  Price Range (BDT)
                </h4>
                <form 
                  onSubmit={(e) => {
                    handlePriceApply(e);
                    setIsFilterOpen(false);
                  }} 
                  className="space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/30 transition-all"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/30 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-rust-copper/10 text-rust-copper hover:bg-rust-copper hover:text-white py-1.5 text-xs font-semibold transition-all"
                  >
                    Apply Price
                  </button>
                </form>
              </div>

              {/* Rating */}
              <div className="space-y-3 border-t border-gray-100 pt-5">
                <h4 className="text-xs font-bold text-slate-gray uppercase tracking-wider">
                  Minimum Rating
                </h4>
                <div className="space-y-2.5">
                  {[
                    { label: "4★ & up", val: "4" },
                    { label: "3★ & up", val: "3" },
                    { label: "2★ & up", val: "2" },
                    { label: "Any Rating", val: "0" },
                  ].map((r) => (
                    <label 
                      key={r.val} 
                      className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-slate-gray cursor-pointer select-none"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      <input
                        type="radio"
                        name="rating-mobile"
                        checked={rating === r.val}
                        onChange={() => updateQuery({ rating: r.val === "0" ? null : r.val })}
                        className="h-4 w-4 border-gray-300 text-rust-copper focus:ring-rust-copper/50 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        {r.val !== "0" && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS LISTING CONTAINER */}
        <main className="flex-grow space-y-8">
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : !productData || productData.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-gray-200/80 bg-white text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-cream text-rust-copper mb-4">
                <FilterX className="h-8 w-8" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-gray mb-1">
                No matching hardware found
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                We couldn't find any products that match your current filter selections. Try clearing your filters or widening your scope.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rust-copper text-white font-heading font-semibold text-sm transition-all hover:bg-rust-copper/90 active:scale-[0.98]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {productData.products.map((prod) => (
                  <ProductCard key={prod._id} product={prod} />
                ))}
              </div>

              {/* Pagination Component */}
              {productData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 pt-6 mt-4">
                  
                  {/* Prev */}
                  <button
                    onClick={() => updateQuery({ page: (page - 1).toString() })}
                    disabled={page <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-gray hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>

                  {/* Numbers */}
                  {Array.from({ length: productData.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => updateQuery({ page: pageNumber.toString() })}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          pageNumber === page
                            ? "bg-rust-copper text-white shadow-md shadow-rust-copper/20"
                            : "border border-gray-200 bg-white text-slate-gray hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {/* Next */}
                  <button
                    onClick={() => updateQuery({ page: (page + 1).toString() })}
                    disabled={page >= productData.totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-gray hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
