import React, { Suspense } from "react";
import PCBuilderClient from "@/components/pc-builder/PCBuilderClient";

export const metadata = {
  title: "PC Builder - Assemble Your Dream Rig | MEG PCs",
  description: "Configure your custom computer with real-time compatibility checks, pricing details, and Gemini-driven AI component recommendations.",
};

export default function PCBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center bg-warm-cream">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-rust-copper border-t-transparent" />
            <p className="text-sm font-semibold text-slate-gray animate-pulse">
              Initializing PC Builder workspace...
            </p>
          </div>
        </div>
      }
    >
      <PCBuilderClient />
    </Suspense>
  );
}
