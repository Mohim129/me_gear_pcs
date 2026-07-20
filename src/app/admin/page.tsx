"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockAlerts: number;
}

interface Order {
  _id: string;
  userName: string;
  userEmail: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  stats: Stats;
  recentOrders: Order[];
  monthlyRevenue: { name: string; revenue: number }[];
  categorySales: { name: string; value: number }[];
}

const COLORS = ["#D97706", "#475569", "#059669", "#2563EB", "#7C3AED", "#DB2777", "#4F46E5", "#0891B2"];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      return res.json();
    },
    enabled: mounted,
  });

  if (!mounted || isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rust-copper animate-spin" />
        <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 mt-4">Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
        <h2 className="text-lg font-bold text-red-700 dark:text-red-400 font-heading">Error</h2>
        <p className="text-sm text-red-650 dark:text-red-300 mt-1">
          {error?.message || "Could not retrieve metrics. Please check connection."}
        </p>
      </div>
    );
  }

  const { stats, recentOrders, monthlyRevenue, categorySales } = data;

  const statsCards = [
    {
      title: "Total Revenue",
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      description: "Delivered & shipped orders",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      description: "All incoming sales logs",
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      description: "In store catalog",
      icon: Package,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockAlerts.toString(),
      description: "Items with stock ≤ 5",
      icon: AlertTriangle,
      color: stats.lowStockAlerts > 0 
        ? "text-amber-600 bg-amber-50 dark:bg-amber-950/20 animate-pulse" 
        : "text-gray-600 bg-gray-50 dark:bg-zinc-800/50",
    },
  ];

  const statusConfig: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-900/50",
    Confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/50",
    Shipped: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/50",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/50",
    Cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/25 dark:text-red-400 dark:border-red-900/50",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-zinc-100 dark:text-zinc-150 leading-none">Administration Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Overview of store sales performance, catalog stocks, and actions.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm text-xs font-semibold text-slate-900 dark:text-zinc-100 dark:text-zinc-300">
          <Calendar className="h-4 w-4 text-rust-copper" />
          Realtime Database Metrics
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-2xl font-black font-heading text-slate-900 dark:text-zinc-100 dark:text-zinc-100">{card.value}</h3>
                <p className="text-xs text-gray-500 leading-none">{card.description}</p>
              </div>
              <div className={`p-3.5 rounded-2xl flex-shrink-0 ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-rust-copper" />
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-zinc-100 dark:text-zinc-200">Monthly Revenue</h3>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3F3F46" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [value ? `৳${Number(value).toLocaleString()}` : "৳0", "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#D97706" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-[380px]">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-zinc-100 dark:text-zinc-200 mb-6">Sales by Category</h3>
          <div className="flex-1 w-full text-xs flex flex-col items-center justify-center">
            {categorySales.length === 0 ? (
              <p className="text-xs text-gray-500">No category sales records logged.</p>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySales.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categorySales.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value || 0, "Items Sold"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
                  {categorySales.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-900 dark:text-zinc-100 dark:text-zinc-300">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200/80 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-zinc-100 dark:text-zinc-200">Recent Orders</h3>
          <Link href="/admin/orders" className="text-rust-copper hover:text-rust-copper/90 font-bold text-xs flex items-center gap-1 hover:underline">
            Manage All Orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-zinc-950/20 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Fulfillment Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/85">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-gray-500">
                    No orders have been placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 dark:text-zinc-300">
                      #{order._id.substring(order._id.length - 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-zinc-100 dark:text-zinc-200 leading-none">{order.userName}</p>
                        <span className="text-[10px] text-gray-400">{order.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100 dark:text-zinc-250">
                      ৳{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig[order.status] || "bg-gray-100"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/orders?search=${order._id}`} className="text-rust-copper hover:text-rust-copper/90 font-bold text-xs hover:underline">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
