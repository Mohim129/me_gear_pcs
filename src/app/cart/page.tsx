"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { useCartStore, CartItem } from "@/store/cart";
import { useSession } from "@/lib/auth-client";

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [expandedBuilds, setExpandedBuilds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleBuildExpand = (id: string) => {
    setExpandedBuilds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-6">
          <ShoppingBag className="h-10 w-10 text-gray-300" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Looks like you haven&apos;t added any components yet. Start building your dream rig!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-rust-copper text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-rust-copper/90 transition-all shadow-md"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse Components
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!session) {
      toast.error("Please log in to proceed to checkout.");
      router.push("/login?callback=/cart");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between border-b border-gray-200/80 pb-6 mb-8">
        <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-rust-copper" />
          YOUR CART
        </h1>
        <span className="text-sm text-gray-500 font-medium">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-7 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Image */}
                <div className="relative w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === "custom_build" && (
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Cpu className="h-2.5 w-2.5" />
                        Custom Build
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </h3>
                  <p className="text-sm font-bold text-rust-copper mt-0.5">
                    ৳{item.price.toLocaleString()}
                  </p>

                  {/* Custom build expand toggle */}
                  {item.type === "custom_build" && item.components && (
                    <button
                      onClick={() => toggleBuildExpand(item.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
                    >
                      {expandedBuilds.has(item.id) ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Hide Components
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Show {Object.keys(item.components).length} Components
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Quantity & Actions */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {item.type !== "custom_build" && (
                    <div className="flex items-center border border-gray-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="px-2.5 py-1.5 text-gray-500 hover:text-slate-900 dark:text-zinc-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center font-heading font-semibold text-slate-900 dark:text-zinc-200 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1.5 text-gray-500 hover:text-slate-900 dark:text-zinc-100 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="text-right min-w-[80px]">
                    <span className="font-heading font-bold text-slate-900 dark:text-zinc-100 text-sm">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      removeItem(item.id);
                      toast.info(`Removed ${item.name} from cart`);
                    }}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-xl transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded components list for custom builds */}
              {item.type === "custom_build" &&
                item.components &&
                expandedBuilds.has(item.id) && (
                  <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(item.components).map(([slot, comp]) => {
                        const component = comp as { id: string; name: string; price: number };
                        return (
                          <div
                            key={slot}
                            className="flex justify-between items-center text-xs bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-zinc-700"
                          >
                            <div className="min-w-0">
                              <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                                {slot}
                              </span>
                              <span className="block font-medium text-slate-900 dark:text-zinc-300 truncate max-w-[180px]">
                                {component.name}
                              </span>
                            </div>
                            <span className="font-bold text-rust-copper flex-shrink-0 ml-2">
                              ৳{component.price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-md sticky top-24 space-y-6">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-zinc-200 border-b border-gray-150 pb-3">
              ORDER SUMMARY
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-zinc-400">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-200">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-zinc-400">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="border-t border-gray-150 pt-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Total
                </span>
                <span className="text-xl font-black text-rust-copper font-heading">
                  ৳{total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm py-3 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  clearCart();
                  toast.success("Cart cleared!");
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-1 hover:underline cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
