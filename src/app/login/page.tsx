"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

// Brand-colored Google G Logo SVG
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signIn.email({
        email,
        password,
        fetchOptions: {
          onSuccess: (ctx) => {
            setIsLoading(false);
            toast.success("Welcome back to MEG PCs!");
            const userRole = ctx.data?.user?.role;
            if (userRole === "admin") {
              router.push("/admin");
            } else {
              router.push("/");
            }
          },
          onError: (ctx) => {
            setIsLoading(false);
            toast.error(ctx.error.message || "Invalid email or password.");
          },
        },
      });
    } catch (err: any) {
      setIsLoading(false);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleDemoLogin = (role: "user" | "admin") => {
    const demoEmail = role === "admin" ? "admin@megears.com" : "demo@megears.com";
    const demoPassword = role === "admin" ? "admin123" : "demo123";
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    toast.success(`Autofilled credentials for Demo ${role === "admin" ? "Admin" : "User"}. Submitting...`);
    
    setTimeout(() => {
      setIsLoading(true);
      signIn.email({
        email: demoEmail,
        password: demoPassword,
        fetchOptions: {
          onSuccess: (ctx) => {
            setIsLoading(false);
            toast.success(`Logged in successfully as Demo ${role === "admin" ? "Admin" : "User"}!`);
            if (role === "admin" || ctx.data?.user?.role === "admin") {
              router.push("/admin");
            } else {
              router.push("/");
            }
          },
          onError: (ctx) => {
            setIsLoading(false);
            toast.error(ctx.error.message || "Failed to log in with demo account.");
          },
        },
      });
    }, 400);
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      toast.error("Google authentication failed.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-warm-cream">
      {/* Left side - Visual & Brand Tagline (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-gray overflow-hidden">
        <Image
          src="https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"
          alt="MEG PCs Tech Grid"
          fill
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-gray via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-16 left-16 z-20 space-y-4 max-w-md text-white">
          <Link href="/" className="font-logo text-4xl tracking-wider font-bold">
            MEG PCS
          </Link>
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Welcome back to MEG PCs
          </h2>
          <p className="text-gray-300 text-base leading-relaxed">
            Access your custom builds, order status, wishlist, and configuration settings in one unified workspace.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/30">
          
          <div className="text-center">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-gray">
              Sign In
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-gray uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl border border-gray-300/80 bg-white py-3 pl-10 pr-4 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-gray uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast.info("Password reset coming soon")}
                  className="text-xs font-semibold text-rust-copper hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-gray-300/80 bg-white py-3 pl-10 pr-10 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-gray focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rust-copper py-3 text-sm font-semibold text-white shadow-md hover:bg-rust-copper/90 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Seeding Demo Logins */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("user")}
              className="rounded-xl border border-gray-200 hover:border-rust-copper/50 hover:bg-warm-cream/50 py-2.5 text-xs font-semibold text-slate-gray transition-colors text-center"
            >
              Demo User Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              className="rounded-xl border border-gray-200 hover:border-rust-copper/50 hover:bg-warm-cream/50 py-2.5 text-xs font-semibold text-slate-gray transition-colors text-center"
            >
              Demo Admin Login
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-slate-gray hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          {/* Register Link */}
          <div className="text-center text-sm text-gray-500 pt-2">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-rust-copper hover:underline">
              Sign Up
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
