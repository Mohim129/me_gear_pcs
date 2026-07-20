"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  Settings,
  Menu,
  X,
  Home,
  ShieldAlert,
  Loader2
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login?returnTo=/admin");
      } else if (session.user.role !== "admin") {
        router.push("/");
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-warm-cream flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-rust-copper animate-spin" />
        <p className="text-sm font-medium text-slate-gray mt-4">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="min-h-screen bg-warm-cream flex flex-col items-center justify-center p-6">
        <ShieldAlert className="h-14 w-14 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-xl font-bold text-slate-gray font-heading">Access Restricted</h1>
        <p className="text-sm text-gray-500 text-center max-w-sm mt-1">
          You do not have the required permissions to view the administration dashboard.
        </p>
        <Link
          href="/"
          className="mt-6 bg-slate-gray hover:bg-slate-gray/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Transactions", href: "/admin/transactions", icon: DollarSign },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Inventory", href: "/admin/inventory", icon: Package },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-warm-cream flex flex-col sm:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden sm:flex flex-col w-64 bg-slate-gray text-white border-r border-gray-700/30 flex-shrink-0">
        <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-heading font-bold text-lg text-white leading-none tracking-wide">
              MEG PCs <span className="text-rust-copper">ADMIN</span>
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-rust-copper text-white shadow-md shadow-rust-copper/10"
                    : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700/50 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all hover:bg-zinc-800/40"
          >
            <Home className="h-4 w-4" />
            Store View
          </Link>
          <div className="px-4 py-2 text-xs text-gray-500">
            Signed in as Admin
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="sm:hidden bg-slate-gray text-white flex items-center justify-between px-6 py-4 border-b border-gray-700/30 z-30">
        <span className="font-heading font-bold text-base leading-none">
          MEG <span className="text-rust-copper">ADMIN</span>
        </span>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-300 hover:text-white p-1 cursor-pointer focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 sm:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <nav
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-gray text-white transform transition-transform duration-300 ease-in-out sm:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
          <span className="font-heading font-bold text-lg text-white">MEG ADMIN</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-300 hover:text-white p-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-rust-copper text-white"
                    : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-700/50 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Store View
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
