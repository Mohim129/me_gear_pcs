"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  ShoppingBag,
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";

interface OrderItem {
  product?: string;
  name: string;
  quantity: number;
  price: number;
  meta?: {
    type?: string;
    components?: Array<{ slot: string; name: string; price: number }>;
  };
}

interface Order {
  _id: string;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
  };
}

const statusConfig: Record<
  string,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  Pending: {
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock className="h-4 w-4 text-amber-600" />,
    label: "Pending",
  },
  Confirmed: {
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    label: "Confirmed",
  },
  Shipped: {
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    icon: <Truck className="h-4 w-4 text-purple-600" />,
    label: "Shipped",
  },
  Delivered: {
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
    label: "Delivered",
  },
  Cancelled: {
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    icon: <XCircle className="h-4 w-4 text-red-600" />,
    label: "Cancelled",
  },
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callback=/orders");
    }

    if (!isPending && session && session.user.role !== "admin") {
      router.push("/profile");
    }
  }, [session, isPending, router]);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const res = await fetch("/api/orders?all=true");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!session && session?.user?.role === "admin",
  });

  if (isPending || isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-b border-gray-200/80 pb-6 mb-8">
        <h1 className="text-3xl font-black font-heading tracking-tight text-slate-gray flex items-center gap-2">
          <ShoppingBag className="h-7 w-7 text-rust-copper" />
          ORDER HISTORY
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and view all your past orders.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mx-auto mb-6">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-gray mb-2">
            No Orders Yet
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Looks like you haven't placed any orders yet. Start building your
            dream PC!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-rust-copper text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-rust-copper/90 transition-all shadow-md"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.Pending;
            const itemCount = order.items.reduce(
              (sum, i) => sum + i.quantity,
              0,
            );

            return (
              <Link
                key={order._id}
                href={`/order-confirmation/${order._id}`}
                className="block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-gray">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>
                        {itemCount} {itemCount === 1 ? "item" : "items"} •{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="truncate max-w-md">
                        {order.shippingAddress?.street},{" "}
                        {order.shippingAddress?.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-heading font-bold text-rust-copper text-lg">
                      ৳{order.totalPrice.toLocaleString()}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
