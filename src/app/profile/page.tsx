"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserOrderItem {
  quantity: number;
}

interface UserOrder {
  _id: string;
  status: string;
  totalPrice: number;
  items: UserOrderItem[];
  createdAt: string;
}

interface UserProfile {
  hasPassword?: boolean;
}
import {
  User,
  ShoppingBag,
  Heart,
  LogOut,
  Camera,
  Loader2,
  Check,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Package,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

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

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending, refetch: refetchSession } = useSession();
  const queryClient = useQueryClient();

  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState<string>((session?.user as { phone?: string })?.phone ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isPasswordless = profileData?.hasPassword === false;

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<string>("profile");

  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch profile");
      }
      return res.json();
    },
    enabled: !!session,
  });

  const lastUserId = useRef<string | null>(null);

  React.useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setPhone(session.user.phone ?? "");
    }
  }, [session]);

  React.useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callback=/profile");
    }
  }, [session, isPending, router]);

  React.useEffect(() => {
    if (session?.user) {
      if (session.user.id !== lastUserId.current) {
        setName(session.user.name || "");
        setPhone((session.user as any).phone || "");
        lastUserId.current = session.user.id;
      }
    } else {
      lastUserId.current = null;
    }
  }, [session]);

  // ---------- Orders Query ----------
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersFetchError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["userOrders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch orders");
      }
      return res.json();
    },
    enabled: !!session,
  });

  React.useEffect(() => {
    if (ordersFetchError) {
      toast.error(
        (ordersFetchError as Error).message || "Failed to load orders",
      );
    }
  }, [ordersFetchError]);

  // ---------- Handlers ----------
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API}`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (!data.success) throw new Error("Upload failed");

      const imageUrl = data.data.url;
      const updateRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: imageUrl }),
      });
      if (!updateRes.ok) throw new Error("Failed to update avatar");

      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Avatar updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      await refetchSession?.();
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const isPasswordless = profileData?.hasPassword === false;

    if (!isPasswordless && !currentPassword) {
      toast.error("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const payload: Record<string, string> = { newPassword };
      if (!isPasswordless) payload.currentPassword = currentPassword;

      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully.");
    router.push("/");
  };

  // ---------- Tab Content ----------
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session?.user?.name || "User"}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-rust-copper hover:bg-rust-copper/90 text-white rounded-full p-2 shadow transition-all disabled:opacity-50 cursor-pointer"
                    title="Change avatar"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                    {session?.user?.name || "User"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    Member since{" "}
                    {session?.user?.createdAt
                      ? new Date(session.user.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                          },
                        )
                      : "recently"}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
              <h3 className="font-heading font-bold text-slate-900 dark:text-zinc-200 text-lg">
                Personal Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400">
                    Email cannot be changed.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSavingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
              <div className="flex flex-col gap-2">
                <h3 className="font-heading font-bold text-slate-900 dark:text-zinc-200 text-lg">
                  {profileData?.hasPassword === false ? "Set Account Password" : "Change Password"}
                </h3>
                {profileData?.hasPassword === false && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your account currently uses social login. Set a password here to enable email/password sign-in later.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                {profileData?.hasPassword !== false && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {profileData?.hasPassword === false ? "Set Password" : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        );

      case "orders":
        if (ordersLoading) {
          return (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          );
        }
        if (ordersError) {
          return (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-500 font-medium">Failed to load orders.</p>
              <button
                onClick={() => refetchOrders()}
                className="mt-2 text-rust-copper font-bold hover:underline"
              >
                Try again
              </button>
            </div>
          );
        }
        if (!orders || orders.length === 0) {
          return (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                No orders yet
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Start building your dream PC!
              </p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = statusConfig[order.status] || statusConfig.Pending;
              const itemCount =
                order.items?.reduce(
                  (sum: number, i: any) => sum + i.quantity,
                  0,
                ) || 0;
              return (
                <div
                  key={order._id}
                  onClick={() =>
                    router.push(`/order-confirmation/${order._id}`)
                  }
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {itemCount} {itemCount === 1 ? "item" : "items"} •{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-heading font-bold text-rust-copper text-lg">
                      ৳{order.totalPrice.toLocaleString()}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "wishlist":
        return (
          <div className="text-center py-12 text-gray-500">
            View your wishlist{" "}
            <button
              onClick={() => router.push("/wishlist")}
              className="text-rust-copper font-medium hover:underline"
            >
              here
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="flex gap-8">
          <div className="w-64 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-b border-gray-200/80 pb-6 mb-8">
        <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <User className="h-7 w-7 text-rust-copper" />
          MY ACCOUNT
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile, orders, and preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-3 p-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <hr className="border-gray-150 dark:border-gray-700" />

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-rust-copper/10 text-rust-copper font-bold"
                  : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              <User className="h-4 w-4" /> Profile
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "orders"
                  ? "bg-rust-copper/10 text-rust-copper font-bold"
                  : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Order History
            </button>

            <button
              onClick={() => router.push("/wishlist")}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Heart className="h-4 w-4" /> Wishlist
            </button>

            <hr className="border-gray-150 dark:border-gray-700" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>

        <div className="flex-1">{renderTabContent()}</div>
      </div>
    </div>
  );
}
