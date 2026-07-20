"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Percent,
  TrendingDown,
  Loader2,
  Calendar,
  Filter
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  userName: string;
  userEmail: string;
  totalPrice: number;
  status: string;
  paymentStatus?: "Pending" | "Paid" | "Refunded";
  paymentMethod?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function AdminTransactions() {
  const [dateRange, setDateRange] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All"); // All, Sale, Refund
  const [statusFilter, setStatusFilter] = useState("All"); // All, Completed, Pending, Failed

  // Fetch all orders
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["adminTransactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/orders?status=All");
      if (!res.ok) throw new Error("Failed to fetch transaction logs.");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rust-copper animate-spin" />
        <p className="text-sm font-medium text-slate-gray mt-4">Loading financial transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-xs text-red-500 font-semibold">
        {error?.message || "Failed to load transaction ledger."}
      </div>
    );
  }

  // Calculate Metrics from raw data
  const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");
  const refundedOrders = orders.filter((o) => o.paymentStatus === "Refunded");
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRefundedRevenue = refundedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const netRevenue = totalPaidRevenue - totalRefundedRevenue;
  const avgTransaction = paidOrders.length > 0 ? netRevenue / paidOrders.length : 0;
  const refundRate = orders.length > 0 ? (refundedOrders.length / orders.length) * 100 : 0;

  // Filter transaction list
  const filteredTransactions = orders.filter((order) => {
    // 1. Date filter (simplified: check days)
    if (dateRange !== "All") {
      const orderTime = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const dayDiff = (now - orderTime) / (1000 * 3600 * 24);
      if (dateRange === "7days" && dayDiff > 7) return false;
      if (dateRange === "30days" && dayDiff > 30) return false;
    }

    // 2. Type filter (Sale: Paid/Pending, Refund: Refunded)
    if (typeFilter !== "All") {
      const isRefund = order.paymentStatus === "Refunded";
      if (typeFilter === "Sale" && isRefund) return false;
      if (typeFilter === "Refund" && !isRefund) return false;
    }

    // 3. Status filter
    if (statusFilter !== "All") {
      const pStatus = order.paymentStatus || "Pending";
      if (statusFilter === "Completed" && pStatus !== "Paid") return false;
      if (statusFilter === "Pending" && pStatus !== "Pending") return false;
      if (statusFilter === "Failed" && pStatus !== "Refunded" && order.status !== "Cancelled") return false;
    }

    return true;
  });

  const summaryCards = [
    {
      title: "Net Revenue",
      value: `৳${netRevenue.toLocaleString()}`,
      description: `Sales: ৳${totalPaidRevenue.toLocaleString()} | Refunds: ৳${totalRefundedRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Avg Transaction Size",
      value: `৳${Math.round(avgTransaction).toLocaleString()}`,
      description: "Average per paid order",
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Refund Rate",
      value: `${refundRate.toFixed(1)}%`,
      description: `${refundedOrders.length} orders refunded`,
      icon: Percent,
      color: refundRate > 5 
        ? "text-red-650 bg-red-50 dark:bg-red-950/20" 
        : "text-gray-600 bg-gray-50 dark:bg-zinc-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-gray dark:text-zinc-150 leading-none">Financial Ledger</h1>
          <p className="text-xs text-gray-500 mt-1">Review net store earnings, average checkout sizes, refund metrics, and list payments.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-2xl font-black font-heading text-slate-gray dark:text-zinc-100">{card.value}</h3>
                <p className="text-xs text-gray-500 leading-none">{card.description}</p>
              </div>
              <div className={`p-3.5 rounded-2xl flex-shrink-0 ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-gray dark:text-zinc-350">
          <Filter className="h-4 w-4 text-rust-copper" />
          Filter Ledger
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Date range dropdown */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-gray focus:outline-none"
          >
            <option value="All">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>

          {/* Type filter dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-gray focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Sale">Sale (Sale/Invoice)</option>
            <option value="Refund">Refund (Refund)</option>
          </select>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-gray focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed (Paid)</option>
            <option value="Pending">Pending (Pending)</option>
            <option value="Failed">Failed / Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-zinc-950/20 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/80">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-gray-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((order) => {
                  const isRefund = order.paymentStatus === "Refunded";
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-gray dark:text-zinc-300">
                        #{order._id.substring(order._id.length - 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-gray dark:text-zinc-200 leading-none">{order.userName}</p>
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
                      <td className="px-6 py-4 text-xs font-medium text-slate-gray dark:text-zinc-305">
                        {order.paymentMethod || "Cash on Delivery"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isRefund 
                            ? "bg-red-50 text-red-700 dark:bg-red-950/20" 
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                        }`}>
                          {isRefund ? "Refund" : "Sale"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          order.paymentStatus === "Paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : order.paymentStatus === "Refunded"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}>
                          {order.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${
                        isRefund ? "text-red-650" : "text-emerald-650"
                      }`}>
                        {isRefund ? "-" : "+"}৳{order.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
