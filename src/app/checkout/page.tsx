"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Truck, Package, ShieldCheck, Cpu } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useSession } from "@/lib/auth-client";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipping form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated – inside useEffect to avoid render‑phase updates
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callback=/checkout");
    }
  }, [session, isPending, router]);

  // Redirect to cart if empty – inside useEffect, only after hydration
  useEffect(() => {
    if (mounted && !isPending && session && items.length === 0) {
      router.push("/cart");
    }
  }, [mounted, isPending, session, items.length, router]);

  // Loading state (skeleton) while redirects are pending
  if (!mounted || isPending || !session) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // After redirect effects have finished, if we're still here the cart is not empty
  if (items.length === 0) return null; // safety guard

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal;

  const handlePlaceOrder = async () => {
    // Validate
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!street.trim()) {
      toast.error("Please enter your street address.");
      return;
    }
    if (!city.trim()) {
      toast.error("Please enter your city.");
      return;
    }
    if (!zip.trim()) {
      toast.error("Please enter your ZIP code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            zip: zip.trim(),
          },
          totalPrice: total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order-confirmation/${data._id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-b border-gray-200/80 pb-6 mb-8">
        <h1 className="text-3xl font-black font-heading tracking-tight text-slate-gray flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-rust-copper" />
          CHECKOUT
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete your order by providing shipping details below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left: Shipping Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
            <h3 className="font-heading font-bold text-slate-gray dark:text-zinc-200 flex items-center gap-2">
              <Truck className="h-5 w-5 text-rust-copper" />
              Shipping Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahim Ahmed"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-gray dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-gray dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Street Address *
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. House 12, Road 5, Dhanmondi"
                className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-gray dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dhaka"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-gray dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-gray dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g. 1205"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-gray dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="font-heading font-bold text-slate-gray dark:text-zinc-200 flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-rust-copper" />
              Payment Method
            </h3>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  Cash on Delivery
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Pay when your order arrives at your doorstep
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-md sticky top-24 space-y-6">
            <h3 className="font-heading text-lg font-bold text-slate-gray dark:text-zinc-200 border-b border-gray-150 pb-3">
              ORDER SUMMARY
            </h3>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs">
                  <div className="relative w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.type === "custom_build" && (
                        <Cpu className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-slate-gray dark:text-zinc-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-gray-400">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-rust-copper flex-shrink-0">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-150 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-zinc-400">
                <span>Subtotal</span>
                <span className="font-semibold">
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

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm py-3.5 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck className="h-4.5 w-4.5" />
              )}
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
