"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserPlus,
  Loader2,
  Calendar,
  ShoppingBag,
  Eye,
  X,
  Phone,
  Mail
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalOrders: number;
}

interface CustomerStats {
  totalCustomers: number;
  activeToday: number;
  newThisMonth: number;
}

interface CustomersData {
  customers: Customer[];
  stats: CustomerStats;
}

interface CustomerOrder {
  _id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function AdminCustomers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers list and stats
  const { data, isLoading, error } = useQuery<CustomersData>({
    queryKey: ["adminCustomers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/customers");
      if (!res.ok) throw new Error("Failed to fetch customers list");
      return res.json();
    },
  });

  // Fetch orders for a specific customer on modal trigger
  const { data: customerOrders = [], isLoading: isLoadingOrders } = useQuery<CustomerOrder[]>({
    queryKey: ["adminCustomerOrders", selectedCustomer?._id],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const res = await fetch(`/api/admin/customers/${selectedCustomer._id}/orders`);
      if (!res.ok) throw new Error("Failed to fetch customer order history");
      return res.json();
    },
    enabled: !!selectedCustomer,
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rust-copper animate-spin" />
        <p className="text-sm font-medium text-slate-gray mt-4">Loading customer registry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-xs text-red-500 font-semibold">
        {error?.message || "Failed to load customer profiles."}
      </div>
    );
  }

  const { customers, stats } = data;

  const statsCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      description: "Registered user accounts",
      icon: Users,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Active Today",
      value: stats.activeToday.toString(),
      description: "Checked out / ordered today",
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "New This Month",
      value: stats.newThisMonth.toString(),
      description: "Signed up since 1st",
      icon: UserPlus,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-gray dark:text-zinc-150 leading-none">Customers Directory</h1>
        <p className="text-xs text-gray-500 mt-1">Review registered shopper profiles, contact logs, and purchase records.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card, idx) => {
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

      {/* Customers Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-zinc-950/20 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-255 dark:border-zinc-800">
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Orders Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/80">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-gray-500">
                    No registered user accounts found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                    <td className="px-6 py-4 font-semibold text-slate-gray dark:text-zinc-200">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {c.email}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {c.phone || "Not provided"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-gray dark:text-zinc-300">
                      {c.totalOrders} order(s)
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="text-rust-copper hover:text-rust-copper/90 p-1.5 rounded-lg border border-gray-250 dark:border-zinc-700 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold float-right shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Orders
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-8 max-h-[80vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-slate-gray text-white">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-rust-copper" />
                <div>
                  <h3 className="font-heading font-bold text-base leading-none">Customer Purchase History</h3>
                  <span className="text-[10px] text-gray-300">Viewing orders for {selectedCustomer.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-350 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              {/* Profile card summary */}
              <div className="bg-gray-50 dark:bg-zinc-950/20 border border-gray-200/50 dark:border-zinc-800/80 p-4 rounded-xl space-y-2 text-xs text-slate-gray dark:text-zinc-350">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /> {selectedCustomer.email}</div>
                {selectedCustomer.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /> {selectedCustomer.phone}</div>}
              </div>

              {/* Orders History List */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider">Complete Order Logs</h4>
                
                {isLoadingOrders ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-6 w-6 text-rust-copper animate-spin" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">
                    No orders have been placed by this customer.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerOrders.map((order) => (
                      <div
                        key={order._id}
                        className="p-4 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 flex justify-between items-center shadow-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-slate-gray dark:text-zinc-200">
                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                          </p>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right space-y-1.5">
                          <p className="font-bold text-slate-gray dark:text-zinc-200">৳{order.totalPrice.toLocaleString()}</p>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-gray-50 text-slate-gray dark:bg-zinc-800 dark:text-zinc-300">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950/15 border-t border-gray-200 dark:border-zinc-800 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="bg-slate-gray hover:bg-slate-gray/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
