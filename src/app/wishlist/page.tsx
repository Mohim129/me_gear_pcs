"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Trash2, ShoppingBag, Star, Package } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useWishlistStore } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";

interface WishlistProduct {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: { name: string; slug: string };
  brand?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}

interface WishlistItem {
  _id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct | null;
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callback=/wishlist");
    }
  }, [session, isPending, router]);

  const {
    data: wishlistItems,
    isLoading,
    refetch,
  } = useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist");
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      return res.json();
    },
    enabled: !!session,
  });

  // Show skeleton while session is being determined
  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Once session is determined, if not logged in, the useEffect will redirect; render nothing
  if (!session) return null;

  const handleMoveToCart = async (product: WishlistProduct) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });

    try {
      await removeFromWishlist(product._id);
      refetch();
      toast.success(`${product.name} moved to cart!`);
    } catch {
      toast.error("Failed to remove from wishlist");
    }
  };

  const handleRemove = async (productId: string, productName: string) => {
    try {
      await removeFromWishlist(productId);
      refetch();
      toast.info(`${productName} removed from wishlist`);
    } catch {
      toast.error("Failed to remove from wishlist");
    }
  };

  const validItems =
    wishlistItems?.filter((item) => item.product !== null) || [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="h-7 w-7 text-rust-copper" />
          <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-zinc-100">
            MY WISHLIST
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-2xl" />
              <div className="bg-white p-4 rounded-b-2xl space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-6 mb-8">
        <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Heart className="h-7 w-7 text-rust-copper" />
          MY WISHLIST
        </h1>
        <span className="text-sm text-gray-500 font-medium">
          {validItems.length} {validItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      {validItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-6">
            <Heart className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
            Your Wishlist is Empty
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Start exploring our components and save the ones you love!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-rust-copper text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-rust-copper/90 transition-all shadow-md"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Components
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {validItems.map((item) => {
            const product = item.product!;
            const discount = product.originalPrice
              ? Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100,
                )
              : 0;

            return (
              <div
                key={item._id}
                className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1"
              >
                {/* Badge */}
                {discount > 0 && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-rust-copper px-2.5 py-1 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                )}

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(product._id, product.name)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* Image */}
                <Link
                  href={`/products/${product._id}`}
                  className="relative aspect-square overflow-hidden bg-gray-50"
                >
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
                      <Package className="h-12 w-12 text-gray-300" />
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
                      <span className="text-xs text-gray-400 ml-1">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="font-heading font-bold text-slate-900 dark:text-zinc-100 text-lg">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice &&
                      product.originalPrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ৳{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                  </div>

                  {/* Move to Cart */}
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-slate-gray px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rust-copper cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
