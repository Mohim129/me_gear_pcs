"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signUp, signIn } from "@/lib/auth-client";
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from "lucide-react";

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

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      toast.error("You must agree to the Terms & Privacy Policy.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp.email({
        email,
        password,
        name,
        fetchOptions: {
          onSuccess: () => {
            setIsLoading(false);
            toast.success("Account created successfully! Please sign in.");
            router.push("/login");
          },
          onError: (ctx) => {
            setIsLoading(false);
            toast.error(ctx.error.message || "Registration failed. Try again.");
          },
        },
      });
    } catch (err) {
      setIsLoading(false);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleGoogleSignup = async () => {
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
      {/* Left side - Visual (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-gray overflow-hidden">
        <Image
          src="https://i.ibb.co.com/5gL7TzWJ/meg-PCs-hero1.jpg"
          alt="MEG PCs Gaming Build"
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
            Craft Your Build Ecosystem
          </h2>
          <p className="text-gray-300 text-base leading-relaxed">
            Create an account to save custom configurations, track custom gaming PC builds, access saved wishlists, and buy components easily.
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-7 bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/30">
          
          <div className="text-center">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-gray">
              Create Account
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Sign up to unlock custom PC compatibility checking and ordering
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-gray uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-xl border border-gray-300/80 bg-white py-3 pl-10 pr-4 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

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
              <label htmlFor="password" className="text-xs font-semibold text-slate-gray uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-gray uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full rounded-xl border border-gray-300/80 bg-white py-3 pl-10 pr-10 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-gray focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start gap-2.5 py-1">
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-rust-copper focus:ring-rust-copper/50 mt-0.5 transition-colors cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-xs text-gray-500 leading-tight select-none cursor-pointer">
                I agree to the{" "}
                <Link href="#terms" className="font-semibold text-rust-copper hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#privacy" className="font-semibold text-rust-copper hover:underline">
                  Privacy Policy
                </Link>
              </label>
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
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              OR SIGN UP WITH
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Signup */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-slate-gray hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-500 pt-1">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-rust-copper hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
