"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings,
  Shield,
  Bell,
  Save,
  Loader2,
  Lock,
  Mail,
  Building
} from "lucide-react";

interface StoreConfig {
  storeName: string;
  supportEmail: string;
  currency: string;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("MEG PCs");
  const [supportEmail, setSupportEmail] = useState("support@megears.com");
  const [currency, setCurrency] = useState("BDT");

  // Fetch current settings
  const { data: config, isLoading } = useQuery<StoreConfig>({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch store settings");
      return res.json();
    },
  });

  // Pre-fill state when settings load
  useEffect(() => {
    if (config) {
      setStoreName(config.storeName || "MEG PCs");
      setSupportEmail(config.supportEmail || "support@megears.com");
      setCurrency(config.currency || "BDT");
    }
  }, [config]);

  // Settings update mutation
  const saveMutation = useMutation({
    mutationFn: async (updated: StoreConfig) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update configurations");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !supportEmail.trim()) {
      toast.error("All settings fields are required.");
      return;
    }
    saveMutation.mutate({ storeName, supportEmail, currency });
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rust-copper animate-spin" />
        <p className="text-sm font-medium text-slate-gray mt-4">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-gray dark:text-zinc-150 leading-none">Global Configurations</h1>
        <p className="text-xs text-gray-500 mt-1">Configure general store variables, security levels, and notification triggers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Navigation Links (decorative) */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold bg-rust-copper text-white text-left transition-all">
            <Settings className="h-4.5 w-4.5" />
            Store Profile Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:bg-gray-150 dark:hover:bg-zinc-800 text-slate-gray dark:text-zinc-350 text-left transition-all">
            <Shield className="h-4.5 w-4.5" />
            Security & Authentication
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold hover:bg-gray-150 dark:hover:bg-zinc-800 text-slate-gray dark:text-zinc-350 text-left transition-all">
            <Bell className="h-4.5 w-4.5" />
            Notifications Config
          </button>
        </div>

        {/* Right Side: Tab Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Store profile */}
          <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-gray dark:text-zinc-200 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-rust-copper" />
              Store Profile Settings
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase">Store Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="MEG PCs"
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase">Default Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50"
                  >
                    <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase">Support Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-450" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@megears.com"
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-10 pr-4 py-2.5 text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-150 text-right">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 float-right shadow-xs disabled:opacity-55"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Store Settings
              </button>
              <div className="clear-both" />
            </div>
          </form>

          {/* Placeholders for Security and Alerts */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 opacity-75">
            <h3 className="font-heading font-bold text-sm text-slate-gray dark:text-zinc-200 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-rust-copper" />
              Security & Notifications (System Default)
            </h3>
            <div className="space-y-3.5 text-xs text-gray-500 leading-relaxed">
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked disabled className="rounded border-gray-300 text-rust-copper focus:ring-rust-copper h-4 w-4" />
                <div>
                  <p className="font-bold text-slate-gray dark:text-zinc-300 leading-none">Two-Factor Authentication (2FA)</p>
                  <span className="text-[10px]">Require OTP authentication code for admin dashboard actions.</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked disabled className="rounded border-gray-300 text-rust-copper focus:ring-rust-copper h-4 w-4" />
                <div>
                  <p className="font-bold text-slate-gray dark:text-zinc-300 leading-none">Slack & Email stock alerts</p>
                  <span className="text-[10px]">Send email alerts immediately when product inventory falls below 5.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
