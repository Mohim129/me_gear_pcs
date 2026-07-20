"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Calendar,
  DollarSign,
  Truck,
  User,
  Phone,
  MapPin,
  ClipboardList,
  ChevronRight,
  Eye,
  X
} from "lucide-react";

interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  meta?: {
    type?: string;
    components?: Array<{ slot: string; productId: string; name: string; price: number }>;
  };
}

interface Order {
  _id: string;
  userName: string;
  userEmail: string;
  totalPrice: number;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  paymentStatus?: "Pending" | "Paid" | "Refunded";
  paymentMethod?: string;
  items: OrderItem[];
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state?: string;
    zip: string;
  };
}

const statusTabs = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders from API
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["adminOrders", search, activeStatus],
    queryFn: async () => {
      const url = `/api/admin/orders?search=${encodeURIComponent(search)}&status=${encodeURIComponent(activeStatus)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders log.");
      return res.json();
    },
  });

  // Status modification mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, paymentStatus, paymentMethod }: { id: string; status?: string; paymentStatus?: string; paymentMethod?: string }) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, paymentMethod }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update order");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      toast.success("Order status updated successfully!");
      
      // Update selected order details view if open
      if (selectedOrder && selectedOrder._id === variables.id) {
        setSelectedOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: variables.status as any || prev.status,
            paymentStatus: variables.paymentStatus as any || prev.paymentStatus,
            paymentMethod: variables.paymentMethod || prev.paymentMethod,
          };
        });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to modify order.");
    },
  });

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-900/50",
    Confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/50",
    Shipped: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/50",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/50",
    Cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/25 dark:text-red-400 dark:border-red-900/50",
  };

  const paymentColors: Record<string, string> = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-250 dark:bg-yellow-950/20 dark:text-yellow-400",
    Paid: "bg-green-50 text-green-700 border-green-250 dark:bg-green-950/20 dark:text-green-400",
    Refunded: "bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-gray dark:text-zinc-150 leading-none">Orders Processing</h1>
        <p className="text-xs text-gray-500 mt-1">Search, fulfill, modify payments status, and adjust custom builds configurations.</p>
      </div>

      {/* Search & Filter Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID / customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-350 dark:border-zinc-700 bg-white dark:bg-zinc-850 pl-10 pr-4 py-2.5 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50"
            />
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStatus(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStatus === tab
                    ? "bg-rust-copper text-white shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-gray dark:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-rust-copper animate-spin" />
            <p className="text-xs text-gray-500 mt-3 font-medium">Loading sales records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-500 font-semibold">
            {error?.message || "Failed to load orders log."}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 font-medium">
            No matching orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-zinc-950/20 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-250 dark:border-zinc-800">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total Price</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/80">
                {orders.map((order) => (
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
                    <td className="px-6 py-4 font-bold text-slate-gray dark:text-zinc-250">
                      ৳{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${paymentColors[order.paymentStatus || "Pending"]}`}>
                        {order.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[order.status] || "bg-gray-100"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-rust-copper hover:text-rust-copper/90 p-1.5 rounded-lg border border-gray-250 dark:border-zinc-700 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold float-right shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal Drilldown */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-slate-gray text-white">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-rust-copper" />
                <div>
                  <h3 className="font-heading font-bold text-base leading-none">Order Details</h3>
                  <span className="text-[10px] text-gray-300">ID: {selectedOrder._id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-350 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side info: Customer & Shipping */}
                <div className="space-y-4 bg-gray-50/50 dark:bg-zinc-950/10 border border-gray-200/50 dark:border-zinc-800 p-4 rounded-xl">
                  <h4 className="font-bold text-slate-gray dark:text-zinc-200 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-rust-copper" />
                    Customer & Shipping details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="font-semibold text-slate-gray dark:text-zinc-350">{selectedOrder.userName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="font-semibold text-slate-gray dark:text-zinc-350">{selectedOrder.userEmail}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="font-semibold text-slate-gray dark:text-zinc-350">{selectedOrder.shippingAddress.phone}</span>
                    </p>
                    <div className="pt-2 border-t border-dashed border-gray-200">
                      <p className="text-gray-400 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery Address:</p>
                      <p className="font-medium text-slate-gray dark:text-zinc-300">
                        {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.zip}
                        {selectedOrder.shippingAddress.state && `, ${selectedOrder.shippingAddress.state}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side info: Status and Payment editing */}
                <div className="space-y-4 bg-gray-50/50 dark:bg-zinc-950/10 border border-gray-200/50 dark:border-zinc-800 p-4 rounded-xl">
                  <h4 className="font-bold text-slate-gray dark:text-zinc-200 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-rust-copper" />
                    Fulfillment & Actions
                  </h4>
                  <div className="space-y-3.5">
                    {/* Status Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Fulfillment Status</label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateOrderMutation.mutate({ id: selectedOrder._id, status: e.target.value })}
                        disabled={updateOrderMutation.isPending}
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-gray focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Payment Status Dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Payment Status</label>
                      <select
                        value={selectedOrder.paymentStatus || "Pending"}
                        onChange={(e) => updateOrderMutation.mutate({ id: selectedOrder._id, paymentStatus: e.target.value })}
                        disabled={updateOrderMutation.isPending}
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-gray focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    {/* Payment Method Details */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Payment Method</label>
                      <input
                        type="text"
                        value={selectedOrder.paymentMethod || "Cash on Delivery"}
                        onChange={(e) => updateOrderMutation.mutate({ id: selectedOrder._id, paymentMethod: e.target.value })}
                        disabled={updateOrderMutation.isPending}
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-gray focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <h4 className="font-bold font-heading text-slate-gray dark:text-zinc-200 flex items-center gap-1.5 border-b border-gray-250/70 pb-1.5">
                  <ClipboardList className="h-4.5 w-4.5 text-rust-copper" />
                  Order Items ({selectedOrder.items.length})
                </h4>
                
                <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-gray-150 dark:divide-zinc-800">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-zinc-900 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                          ) : (
                            <ClipboardList className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-gray dark:text-zinc-200">{item.name}</p>
                          <span className="text-xs text-gray-400">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</span>
                          
                          {/* Custom Build Component Sub-table */}
                          {item.meta?.type === "custom_build" && Array.isArray(item.meta.components) && (
                            <div className="mt-3 pl-4 border-l-2 border-rust-copper/40 space-y-1.5">
                              <p className="text-[10px] uppercase font-bold text-rust-copper tracking-wider">Custom PC Build parts</p>
                              {item.meta.components.map((comp, cidx) => (
                                <div key={cidx} className="text-xs text-gray-500 flex justify-between gap-6">
                                  <span className="font-medium capitalize text-[11px] text-gray-400">{comp.slot}:</span>
                                  <span className="truncate max-w-[280px] dark:text-zinc-350">{comp.name} (৳{comp.price.toLocaleString()})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-gray dark:text-zinc-200">৳{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total summary */}
              <div className="flex justify-between items-center py-4 border-t border-gray-250 dark:border-zinc-800">
                <span className="font-bold text-slate-gray dark:text-zinc-300">Grand Total Price:</span>
                <span className="text-2xl font-black font-heading text-rust-copper">৳{selectedOrder.totalPrice.toLocaleString()} BDT</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950/15 border-t border-gray-200 dark:border-zinc-800 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
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
