"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldAlert,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface OrderItem {
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  meta?: {
    type: "custom_build";
    components: Array<{
      slot: string;
      productId: string;
      name: string;
      price: number;
    }>;
  };
}

interface Order {
  _id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state?: string;
    zip: string;
  };
  paymentMethod: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [expandedBuilds, setExpandedBuilds] = useState<Set<number>>(new Set());

  useEffect(() => {
    params.then(({ id }) => setOrderId(id));
  }, [params]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callback=/cart");
    }
  }, [session, isPending, router]);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
    enabled: !!orderId && !!session,
  });

  const toggleBuild = (idx: number) => {
    setExpandedBuilds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!session && !isPending) return null;

  if (isLoading || !orderId) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-16 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
          Order Not Found
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          This order doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-rust-copper text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-rust-copper/90 transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Processing: "bg-blue-100 text-blue-800",
    Shipped: "bg-purple-100 text-purple-800",
    Delivered: "bg-emerald-100 text-emerald-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
          <CheckCircle className="h-9 w-9" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-100">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-gray-500">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>
      </div>

      {/* Order Info Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Order ID
            </p>
            <p className="font-heading font-bold text-slate-900 dark:text-zinc-200 text-sm">
              #{order._id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Date
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-300">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[order.status] || "bg-gray-100 text-gray-800"
                }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="flex gap-3">
          <MapPin className="h-5 w-5 text-rust-copper flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Shipping Address
            </p>
            <p className="text-sm text-slate-900 dark:text-zinc-300 font-medium">
              {order.shippingAddress.fullName}
            </p>
            <p className="text-xs text-gray-500">
              {order.shippingAddress.street}, {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} –{" "}
              {order.shippingAddress.zip}
            </p>
            <p className="text-xs text-gray-500">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="flex gap-3">
          <CreditCard className="h-5 w-5 text-rust-copper flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Payment Method
            </p>
            <p className="text-sm text-slate-900 dark:text-zinc-300 font-medium">
              {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        <h3 className="font-heading font-bold text-slate-900 dark:text-zinc-200 flex items-center gap-2">
          <Package className="h-5 w-5 text-rust-copper" />
          Order Items
        </h3>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {item.meta?.type === "custom_build" && (
                    <Cpu className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-rust-copper">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </span>
                  {item.meta?.type === "custom_build" && (
                    <button
                      onClick={() => toggleBuild(idx)}
                      className="text-purple-500 hover:text-purple-700 cursor-pointer"
                    >
                      {expandedBuilds.has(idx) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {item.meta?.type === "custom_build" &&
                expandedBuilds.has(idx) && (
                  <div className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 px-4 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.meta.components.map((comp) => (
                        <div
                          key={comp.slot}
                          className="flex justify-between items-center text-xs bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-zinc-700"
                        >
                          <div className="min-w-0">
                            <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                              {comp.slot}
                            </span>
                            <span className="block font-medium text-slate-900 dark:text-zinc-300 truncate max-w-[160px]">
                              {comp.name}
                            </span>
                          </div>
                          <span className="font-bold text-rust-copper flex-shrink-0 ml-2">
                            ৳{comp.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-gray-150 pt-4 flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Order Total
          </span>
          <span className="text-xl font-black text-rust-copper font-heading">
            ৳{order.totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Continue Shopping */}
      <div className="text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-rust-copper text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-rust-copper/90 transition-all shadow-md"
        >
          <ShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
