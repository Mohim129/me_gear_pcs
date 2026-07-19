import React from "react";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import { connectToDatabase } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const product = await db.collection("products").findOne({ _id: id } as any);
    
    if (!product) {
      return {
        title: "Product Not Found - MEG PCs",
      };
    }
    
    return {
      title: `${product.name} - MEG PCs`,
      description: product.description || "Browse PC parts at MEG PCs.",
    };
  } catch (error) {
    return {
      title: "Component Hardware Details - MEG PCs",
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ProductDetailClient productId={id} />;
}
