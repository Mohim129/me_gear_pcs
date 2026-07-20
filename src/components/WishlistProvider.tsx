"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useWishlistStore } from "@/store/wishlist";

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  useEffect(() => {
    if (session?.user) {
      fetchWishlist();
    } else {
      clearWishlist();
    }
  }, [session?.user, fetchWishlist, clearWishlist]);

  return <>{children}</>;
}
