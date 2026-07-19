"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  User, 
  Trash2, 
  Edit2, 
  ShieldAlert, 
  MessageSquare,
  Truck,
  Shield,
  ThumbsUp,
  X
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart";
import ProductCard, { type Product } from "@/components/home/ProductCard";

interface Review {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  productName: string;
  createdAt: string;
}

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews" | "shipping">("description");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // Fetch single product
  const { data: product, isLoading: isProductLoading, isError: isProductError } = useQuery<any>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
  });

  // Fetch reviews
  const { data: reviews, isLoading: isReviewsLoading } = useQuery<Review[]>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  // Fetch related products (same category)
  const { data: relatedProducts } = useQuery<Product[]>({
    queryKey: ["related-products", product?.category?.slug],
    enabled: !!product?.category?.slug,
    queryFn: async () => {
      const res = await fetch(`/api/products?category=${product.category.slug}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch related products");
      const data: Product[] = await res.json();
      return data.filter((p) => p._id !== productId).slice(0, 4);
    },
  });

  // Add Review Mutation
  const addReviewMutation = useMutation({
    mutationFn: async (newReview: { rating: number; comment: string }) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productName: product.name,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review posted successfully!");
      setReviewComment("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Edit Review Mutation
  const editReviewMutation = useMutation({
    mutationFn: async (updatedReview: { reviewId: string; rating: number; comment: string }) => {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReview),
      });
      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review updated successfully!");
      setEditingReviewId(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: () => {
      toast.error("Failed to update review.");
    },
  });

  // Delete Review Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: () => {
      toast.error("Failed to delete review.");
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.image,
    });
    toast.success(`${quantity} x ${product.name} added to cart!`);
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    toast.success(`${product.name} added to your wishlist!`);
  };

  if (isProductLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-1/2 aspect-square bg-gray-200 rounded-2xl" />
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded w-full" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isProductError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-gray mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">The component you are looking for might have been removed or doesn't exist.</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-rust-copper text-white font-heading font-semibold text-sm transition-all hover:bg-rust-copper/90"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  // Stock status styling
  const stock = product.stock || 0;
  let stockBadge = (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
      In Stock ({stock} available)
    </span>
  );
  if (stock === 0) {
    stockBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        Out of Stock
      </span>
    );
  } else if (stock < 5) {
    stockBadge = (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        Low Stock (Only {stock} left)
      </span>
    );
  }

  // Specifications building fallback
  const specs = product.specifications || {
    "Brand": product.brand || "Generic",
    "Model": product.name.split(" ").slice(-2).join(" ") || "Standard",
    "Category": product.category?.name || "PC Hardware",
    "Stock Status": stock > 0 ? "In Stock" : "Out of Stock",
    "Warranty": "2 Years Official Brand Warranty",
  };

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const activeImage = selectedImage || product.image;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
      
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
        <Link href="/" className="hover:text-rust-copper transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-rust-copper transition-colors">Shop</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-rust-copper transition-colors">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-gray truncate font-semibold max-w-[200px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Product Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-white border border-gray-200 rounded-3xl overflow-hidden">
            {activeImage && (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 aspect-square rounded-xl border-2 overflow-hidden bg-white flex-shrink-0 transition-all ${
                    activeImage === img ? "border-rust-copper" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Actions and Basic Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-gray leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              {stockBadge}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">({product.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </div>

          <div className="border-y border-gray-200/80 py-4 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold text-slate-gray">
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-gray-400 line-through">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-gray">Short Description</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
          </div>

          {/* Features bullet points */}
          {product.features && product.features.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-gray font-medium">
              {product.features.map((feat: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rust-copper flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Cart & Quantity Controls */}
          {stock > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Quantity Select */}
              <div className="flex items-center border border-gray-300 rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-slate-gray active:scale-95 font-bold"
                >
                  -
                </button>
                <span className="w-10 text-center font-heading font-semibold text-slate-gray text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-slate-gray active:scale-95 font-bold"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="w-full sm:flex-grow flex items-center justify-center gap-2 rounded-xl bg-rust-copper py-3 px-6 text-sm font-semibold text-white shadow-md hover:bg-rust-copper/90 active:scale-[0.98] transition-all"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                Add to Cart
              </button>

              {/* Add to Wishlist */}
              <button
                onClick={handleAddToWishlist}
                className="p-3 rounded-xl border border-gray-300 hover:border-rust-copper/50 hover:bg-warm-cream/50 text-slate-gray hover:text-rust-copper transition-colors focus:outline-none"
                aria-label="Add to Wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Tabs Section */}
      <div className="border-t border-gray-200/80 pt-8">
        {/* Navigation headers */}
        <div className="flex border-b border-gray-200 overflow-x-auto gap-6 sm:gap-10 pb-px">
          {[
            { id: "description", label: "Description" },
            { id: "specifications", label: "Specifications" },
            { id: "reviews", label: `Reviews (${reviews?.length || 0})` },
            { id: "shipping", label: "Shipping & Support" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`font-heading text-sm sm:text-base font-semibold pb-4 border-b-2 tracking-wide transition-all whitespace-nowrap focus:outline-none ${
                activeTab === tab.id
                  ? "border-rust-copper text-rust-copper"
                  : "border-transparent text-gray-400 hover:text-slate-gray"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="py-6">
          {/* 1. Description */}
          {activeTab === "description" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
              <div className="bg-warm-cream/40 border border-gray-100 p-6 rounded-2xl">
                <h4 className="font-heading font-bold text-slate-gray mb-3">Highlights & Features</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  {product.features?.map((feat: string, idx: number) => (
                    <li key={idx}>{feat}</li>
                  ))}
                  <li>Brand new authentic stock imported directly from official global partners.</li>
                  <li>Complete retail packaging packaging includes user manuals, drivers, and warranty flyers.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. Specifications */}
          {activeTab === "specifications" && (
            <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white max-w-2xl">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {Object.entries(specs).map(([key, val]: [string, any], idx) => (
                    <tr 
                      key={key} 
                      className={`border-b border-gray-100 last:border-0 ${
                        idx % 2 === 0 ? "bg-white" : "bg-warm-cream/20"
                      }`}
                    >
                      <th className="px-6 py-3.5 font-heading font-semibold text-slate-gray w-1/3">
                        {key}
                      </th>
                      <td className="px-6 py-3.5 text-gray-600 font-medium">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Reviews */}
          {activeTab === "reviews" && (
            <div className="space-y-8">
              
              {/* Write Review Form */}
              {session ? (
                <div className="bg-warm-cream/50 border border-gray-200/60 p-6 rounded-2xl space-y-4 max-w-2xl">
                  <h4 className="font-heading font-bold text-slate-gray">
                    Write a Review
                  </h4>
                  <p className="text-xs text-gray-400 leading-normal">
                    *Verified Purchase simulation is active. Demo account demo@megears.com is auto-verified.
                  </p>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-gray">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 transition-transform active:scale-90 ${
                              star <= reviewRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience building with or gaming on this component..."
                      className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 transition-all"
                    />
                  </div>

                  <button
                    onClick={() => addReviewMutation.mutate({ rating: reviewRating, comment: reviewComment })}
                    disabled={addReviewMutation.isPending || !reviewComment}
                    className="rounded-lg bg-rust-copper px-4 py-2 text-xs font-bold text-white hover:bg-rust-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-500 max-w-2xl text-center">
                  Please{" "}
                  <Link href="/login" className="font-semibold text-rust-copper hover:underline">
                    Sign In
                  </Link>{" "}
                  to write a product review.
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4 max-w-3xl">
                {!reviews || reviews.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <MessageSquare className="h-10 w-10 text-gray-300" />
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const isOwnReview = session?.user?.id === rev.userId;
                    const isEditing = editingReviewId === rev._id;

                    return (
                      <div key={rev._id} className="border border-gray-200/80 bg-white p-5 rounded-2xl flex gap-4 items-start">
                        {/* Avatar */}
                        {rev.userAvatar ? (
                          <img
                            src={rev.userAvatar}
                            alt={rev.userName}
                            className="h-10 w-10 rounded-full object-cover border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                        )}

                        {/* Review Content */}
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <cite className="font-heading font-semibold text-slate-gray not-italic text-sm">
                                {rev.userName}
                              </cite>
                              <span className="text-[10px] text-gray-400 ml-2">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Action Buttons for own reviews or admin */}
                            {!isEditing && (isOwnReview || session?.user?.role === "admin") && (
                              <div className="flex items-center gap-2">
                                {isOwnReview && (
                                  <button
                                    onClick={() => {
                                      setEditingReviewId(rev._id);
                                      setEditRating(rev.rating);
                                      setEditComment(rev.comment);
                                    }}
                                    className="p-1 text-gray-400 hover:text-rust-copper transition-colors"
                                    title="Edit Review"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this review?")) {
                                      deleteReviewMutation.mutate(rev._id);
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete Review"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Editable review segment */}
                          {isEditing ? (
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-gray">Edit Rating:</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditRating(star)}
                                    >
                                      <Star
                                        className={`h-4 w-4 ${
                                          star <= editRating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                rows={2}
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-slate-gray focus:outline-none focus:ring-1 focus:ring-rust-copper"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => editReviewMutation.mutate({ reviewId: rev._id, rating: editRating, comment: editComment })}
                                  className="rounded bg-rust-copper px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rust-copper/90 transition-colors"
                                >
                                  Save Change
                                </button>
                                <button
                                  onClick={() => setEditingReviewId(null)}
                                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-gray hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star
                                    key={idx}
                                    className={`h-3.5 w-3.5 ${
                                      idx < rev.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 leading-normal">{rev.comment}</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* 4. Shipping Info */}
          {activeTab === "shipping" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <div className="border border-gray-200/80 p-5 rounded-2xl bg-white space-y-3">
                <div className="flex items-center gap-3 text-rust-copper mb-2">
                  <Truck className="h-6 w-6" />
                  <h4 className="font-heading font-bold text-slate-gray">Reliable Shipping</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We deliver to all 64 districts in Bangladesh. Orders within Dhaka are dispatched within 24 hours and delivered within 1-2 days. Orders outside Dhaka take 2-4 business days.
                </p>
                <p className="text-xs text-gray-400">
                  *All components are packaged with double bubble-wrap cushioning and customized protective boxes.
                </p>
              </div>

              <div className="border border-gray-200/80 p-5 rounded-2xl bg-white space-y-3">
                <div className="flex items-center gap-3 text-rust-copper mb-2">
                  <Shield className="h-6 w-6" />
                  <h4 className="font-heading font-bold text-slate-gray">Comprehensive Warranty</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  This component includes a standard 2-year official brand warranty. All technical claims, warranty exchanges, and diagnostics are fully managed at our service hub in Dhaka.
                </p>
                <p className="text-xs text-gray-400">
                  *Physical damage, burned components, and unauthorized modifications void the warranty.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t border-gray-200/80 pt-10 space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="font-heading text-2xl font-bold text-slate-gray">Related Components</h2>
            <p className="text-sm text-gray-500 mt-1">Customers shopping for this also browsed these items</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
