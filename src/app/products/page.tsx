import React, { Suspense } from "react";
import ProductsExploreClient from "@/components/products/ProductsExploreClient";

export const metadata = {
  title: "Explore Component Hardware - MEG PCs",
  description: "Browse CPUs, GPUs, motherboards, case accessories, laptops, and custom gaming gear at MEG PCs.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-24 bg-warm-cream">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rust-copper border-t-transparent mb-4" />
          <p className="text-sm text-gray-500 font-medium">Initializing components list...</p>
        </div>
      }
    >
      <ProductsExploreClient />
    </Suspense>
  );
}
