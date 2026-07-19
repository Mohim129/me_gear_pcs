"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  LayoutDashboard, 
  LogOut, 
  UserCircle,
  Wrench 
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const cartItems = useCartStore((state) => state.items);
  
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch for Zustand persisted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cartCount = mounted ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlistCount = 0; // Hardcoded placeholder for now

  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        }
      }
    });
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/products" },
    { name: "PC Builder", href: "/builder", icon: Wrench },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  if (user) {
    navLinks.push({ name: "Profile", href: "/profile" });
  }

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-zinc-900/80 dark:border-zinc-800 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="inline-flex items-center">
              <span className="font-logo text-3xl font-bold tracking-wider bg-gradient-to-r from-slate-gray to-rust-copper bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                MEG PCS
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-heading text-sm font-medium tracking-wide transition-colors duration-200 flex items-center gap-1.5 ${
                  isLinkActive(link.href)
                    ? "text-rust-copper border-b-2 border-rust-copper pb-1"
                    : "text-slate-gray hover:text-rust-copper dark:text-zinc-300 dark:hover:text-rust-copper"
                }`}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: Desktop Icons & Auth */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search */}
            <Link
              href="/products"
              className="text-slate-gray hover:text-rust-copper dark:text-zinc-300 dark:hover:text-rust-copper transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* Auth Dependent Navigation Items */}
            {!isPending && (
              <>
                {user ? (
                  <>
                    {!isAdmin ? (
                      <>
                        {/* Wishlist */}
                        <Link
                          href="/wishlist"
                          className="relative text-slate-gray hover:text-rust-copper dark:text-zinc-300 dark:hover:text-rust-copper transition-colors"
                          aria-label="Wishlist"
                        >
                          <Heart className="h-5 w-5" />
                          {wishlistCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rust-copper text-[10px] font-bold text-white">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>

                        {/* Cart */}
                        <Link
                          href="/cart"
                          className="relative text-slate-gray hover:text-rust-copper dark:text-zinc-300 dark:hover:text-rust-copper transition-colors"
                          aria-label="Cart"
                        >
                          <ShoppingBag className="h-5 w-5" />
                          {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rust-copper text-[10px] font-bold text-white">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </>
                    ) : (
                      /* Admin Link */
                      <Link
                        href="/admin"
                        className="inline-flex items-center gap-1.5 font-heading text-xs font-semibold text-white bg-slate-gray px-3 py-1.5 rounded-md hover:bg-slate-gray/90 transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Dashboard
                      </Link>
                    )}

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 text-slate-gray hover:text-rust-copper dark:text-zinc-300 dark:hover:text-rust-copper transition-colors focus:outline-none"
                      >
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-8 w-8 rounded-full border border-gray-300 object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium hidden lg:inline max-w-[120px] truncate">
                          {user.name.split(" ")[0]}
                        </span>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10 focus:outline-none">
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-700">
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Signed in as</p>
                            <p className="text-sm font-semibold truncate text-slate-gray dark:text-zinc-200">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            Profile
                          </Link>
                          <Link
                            href="/profile/orders"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            Orders
                          </Link>
                          {!isAdmin && (
                            <Link
                              href="/wishlist"
                              onClick={() => setDropdownOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            >
                              Wishlist
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-slate-gray hover:text-rust-copper dark:text-zinc-300 dark:hover:text-rust-copper px-3 py-1.5 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm font-medium text-white bg-rust-copper hover:bg-rust-copper/90 px-4 py-1.5 rounded-full shadow-sm hover:shadow transition-all"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}

            {isPending && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-rust-copper border-t-transparent" />
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-gray dark:text-zinc-300 hover:text-rust-copper focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 pt-2 pb-4 space-y-1 shadow-inner animate-fade-in-down">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                isLinkActive(link.href)
                  ? "bg-rust-copper/10 text-rust-copper"
                  : "text-slate-gray hover:bg-gray-50 hover:text-rust-copper dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="flex items-center gap-2">
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.name}
              </span>
            </Link>
          ))}

          {!isPending && (
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-4 space-y-2">
              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-slate-gray hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Search className="h-5 w-5" />
                Search Products
              </Link>

              {user ? (
                <>
                  {!isAdmin ? (
                    <>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-slate-gray hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <span className="flex items-center gap-3">
                          <Heart className="h-5 w-5" />
                          Wishlist
                        </span>
                        {wishlistCount > 0 && (
                          <span className="rounded-full bg-rust-copper px-2 py-0.5 text-xs font-bold text-white">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/cart"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-slate-gray hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <span className="flex items-center gap-3">
                          <ShoppingBag className="h-5 w-5" />
                          Cart
                        </span>
                        {cartCount > 0 && (
                          <span className="rounded-full bg-rust-copper px-2 py-0.5 text-xs font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-slate-gray hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-3 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center rounded-md border border-gray-300 py-2 text-sm font-medium text-slate-gray hover:bg-gray-50 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center rounded-md bg-rust-copper py-2 text-sm font-medium text-white hover:bg-rust-copper/90"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
