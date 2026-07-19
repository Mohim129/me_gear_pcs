"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Cpu, 
  Wind, 
  Layers, 
  Database, 
  HardDrive, 
  Zap, 
  Box, 
  Monitor, 
  Keyboard, 
  Mouse, 
  Volume2, 
  Headphones, 
  Wrench, 
  Sparkles, 
  Trash2, 
  ShoppingBag, 
  Save, 
  Check, 
  AlertTriangle, 
  Info,
  ChevronRight
} from "lucide-react";
import { useBuilderStore, Product } from "@/store/builder";
import { useCartStore } from "@/store/cart";
import { useSession } from "@/lib/auth-client";
import { getCompatibilityWarnings, calculateMinPSUWattage } from "@/lib/compatibility";
import ProductPickerModal from "./ProductPickerModal";

const CORE_SLOTS = [
  { slug: "cpu", name: "CPU", icon: Cpu, required: true },
  { slug: "cooler", name: "CPU Cooler", icon: Wind, required: true },
  { slug: "motherboard", name: "Motherboard", icon: Layers, required: true },
  { slug: "ram", name: "RAM", icon: Database, required: true },
  { slug: "storage", name: "Storage", icon: HardDrive, required: true },
  { slug: "gpu", name: "GPU (Graphics Card)", icon: Monitor, required: true },
  { slug: "psu", name: "Power Supply (PSU)", icon: Zap, required: true },
  { slug: "casing", name: "Casing", icon: Box, required: true },
];

const PERIPHERAL_SLOTS = [
  { slug: "monitor", name: "Monitor", icon: Monitor, required: false },
  { slug: "keyboard", name: "Keyboard", icon: Keyboard, required: false },
  { slug: "mouse", name: "Mouse", icon: Mouse, required: false },
  { slug: "speaker", name: "Speaker", icon: Volume2, required: false },
  { slug: "headphone", name: "Headphone", icon: Headphones, required: false },
];

export default function PCBuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const { 
    selectedComponents, 
    aiSuggestions, 
    selectComponent, 
    removeComponent, 
    confirmBuild, 
    clearBuild 
  } = useBuilderStore();

  const { addItem } = useCartStore();

  // Builder settings
  const [budget, setBudget] = useState<string>("150000");
  const [useCase, setUseCase] = useState<string>("Gaming");
  const [activePicker, setActivePicker] = useState<{ slug: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmedBuildState, setIsConfirmedBuildState] = useState(false);

  // Load build if buildId is provided in URL
  const buildId = searchParams.get("buildId");
  const { data: loadedBuild, isLoading: isLoadingBuild } = useQuery({
    queryKey: ["build", buildId],
    queryFn: async () => {
      const res = await fetch(`/api/builds/${buildId}`);
      if (!res.ok) throw new Error("Failed to load PC build configuration.");
      return res.json();
    },
    enabled: !!buildId,
  });

  useEffect(() => {
    if (loadedBuild && loadedBuild.components) {
      clearBuild();
      Object.entries(loadedBuild.components).forEach(([slot, product]: [string, any]) => {
        selectComponent(slot, product);
      });
      toast.success("Successfully loaded custom build configuration!");
    }
  }, [loadedBuild, clearBuild, selectComponent]);

  // AI mutation
  const aiMutation = useMutation({
    mutationFn: async (payload: { budget: number; useCase: string; selectedComponents: Record<string, string> }) => {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI recommendation failed.");
      return data;
    },
    onSuccess: (data) => {
      toast.success("AI Recommendation complete!");
      // Fetch details of all recommended products
      const recommendedIds = Object.values(data.recommendations) as string[];
      if (recommendedIds.length === 0) return;

      // Populate empty slots in store
      fetch(`/api/products?limit=100`)
        .then((res) => res.json())
        .then((products: Product[]) => {
          Object.entries(data.recommendations).forEach(([slot, id]) => {
            const product = products.find((p) => p._id === id);
            if (product) {
              const reasoning = data.reasoning[slot] || "Optimal performance component matching budget limits.";
              selectComponent(slot, product, true, reasoning);
            }
          });
          setIsConfirmedBuildState(false);
        })
        .catch(() => {
          toast.error("Failed to populate recommended components. Please try manual selection.");
        });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to recommend components.");
    },
  });

  // Calculate pricing
  const coreTotal = CORE_SLOTS.reduce((sum, slot) => sum + (selectedComponents[slot.slug]?.price || 0), 0);
  const peripheralTotal = PERIPHERAL_SLOTS.reduce((sum, slot) => sum + (selectedComponents[slot.slug]?.price || 0), 0);
  const totalPrice = coreTotal + peripheralTotal;

  // Wattage estimation
  const cpu = selectedComponents.cpu || null;
  const gpu = selectedComponents.gpu || null;
  const estWattage = calculateMinPSUWattage(cpu, gpu);
  const selectedPsu = selectedComponents.psu || null;
  const psuWattage = selectedPsu?.specifications?.wattage || null;

  // Check warnings
  const warnings = getCompatibilityWarnings(selectedComponents);

  // Core slots completion
  const isCoreCompleted = CORE_SLOTS.every((slot) => !!selectedComponents[slot.slug]);

  // Check if there are any active AI recommendations with RGB borders
  const hasUnconfirmedAiSuggestions = Object.entries(aiSuggestions).some(
    ([key, value]) => value?.suggested && CORE_SLOTS.some((s) => s.slug === key)
  );

  const handleRecommend = () => {
    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error("Please enter a valid budget greater than 0 BDT.");
      return;
    }

    // Filter to manually picked or confirmed slots (exclude unconfirmed AI picks)
    const manualSelections: Record<string, string> = {};
    Object.entries(selectedComponents).forEach(([slot, p]) => {
      const isSuggested = aiSuggestions[slot]?.suggested;
      if (!isSuggested && CORE_SLOTS.some((s) => s.slug === slot)) {
        manualSelections[slot] = p._id;
      }
    });

    aiMutation.mutate({
      budget: budgetNum,
      useCase,
      selectedComponents: manualSelections,
    });
  };

  const handleSaveBuild = async () => {
    if (!session) {
      toast.error("Please log in to save your PC build.");
      router.push(`/login?callback=/pc-builder`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          components: Object.entries(selectedComponents).reduce((acc, [slot, p]) => {
            acc[slot] = p._id;
            return acc;
          }, {} as Record<string, string>),
          totalPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save build");
      toast.success("PC build saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save build.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = () => {
    if (!session) {
      toast.error("Please log in to finalize and add to cart.");
      router.push(`/login?callback=/pc-builder`);
      return;
    }

    if (!isCoreCompleted) {
      toast.error("Please complete all core components before adding to cart.");
      return;
    }

    // Bundle selections
    addItem({
      id: `build_${Date.now()}`,
      name: "Custom PC Build",
      price: totalPrice,
      quantity: 1,
      image: selectedComponents.casing?.image || selectedComponents.cpu?.image || "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png",
      type: "custom_build",
      components: Object.entries(selectedComponents).reduce((acc, [slot, p]) => {
        acc[slot] = p._id;
        return acc;
      }, {} as Record<string, string>),
    });

    toast.success("Custom PC Build added to your cart!");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200/80 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-slate-gray flex items-center gap-2">
            <Wrench className="h-7 w-7 text-rust-copper" />
            PC BUILDER
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose compatible components manually or let our Gemini-powered AI engine design the perfect setup.
          </p>
        </div>

        {/* AI Recommendations Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-wrap items-center gap-3.5 max-w-xl">
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Budget (BDT)</label>
            <input
              type="number"
              placeholder="e.g. 150000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rust-copper focus:border-rust-copper"
            />
          </div>

          <div className="flex flex-col gap-0.5 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Use Case</label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg px-2.5 py-1.5 text-sm font-semibold border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rust-copper focus:border-rust-copper"
            >
              <option value="Gaming">Gaming Performance</option>
              <option value="Productivity/Office">Office & Productivity</option>
              <option value="Video Editing & Rendering">Video Editing & Rendering</option>
              <option value="Programming">Software Development</option>
              <option value="Casual Use">Casual / General Use</option>
            </select>
          </div>

          <button
            onClick={handleRecommend}
            disabled={aiMutation.isPending}
            className="flex items-center gap-1.5 bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow shadow-rust-copper/25 transition-all self-end disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {aiMutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Recommend PC
          </button>
        </div>
      </div>

      {/* Warnings & AI Confirmation bar */}
      <div className="space-y-3 mb-6">
        {warnings.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h5 className="font-bold text-sm">Compatibility Warnings Detected</h5>
              <ul className="list-disc pl-4 space-y-0.5">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {hasUnconfirmedAiSuggestions && (
          <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-sm text-purple-950 dark:text-purple-300">Gemini-Recommended Components Active</h5>
                <p className="text-xs text-purple-700 dark:text-purple-400">
                  Verify the recommended parts highlighted in moving borders, then accept or customize your picks.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                confirmBuild();
                setIsConfirmedBuildState(true);
                toast.success("Recommended build accepted!");
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all self-end sm:self-auto cursor-pointer"
            >
              Accept AI Build
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* Core slots - Left 70% */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Core Components */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-gray flex items-center gap-2 border-b border-gray-200 pb-2">
              <span className="bg-rust-copper text-white rounded-lg p-1 text-xs">01</span>
              CORE COMPONENTS
              <span className="text-xs font-medium text-gray-400">(Required to build)</span>
            </h3>
            
            <div className="space-y-3.5">
              {CORE_SLOTS.map((slot) => {
                const product = selectedComponents[slot.slug];
                const isSuggested = aiSuggestions[slot.slug]?.suggested;
                const reasoning = aiSuggestions[slot.slug]?.reasoning;
                const SlotIcon = slot.icon;

                return (
                  <div
                    key={slot.slug}
                    className={`rounded-2xl border transition-all duration-300 ${
                      product
                        ? isSuggested
                          ? "ai-suggested-border shadow-md"
                          : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                        : "border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50/20 dark:bg-zinc-900/10 hover:bg-gray-50/50 dark:hover:bg-zinc-850/20"
                    }`}
                  >
                    {!product ? (
                      // Empty state
                      <div className="flex items-center justify-between p-5 gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                            <SlotIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-gray dark:text-zinc-300">
                              {slot.name}
                            </h4>
                            <span className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                              * Category Required
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActivePicker({ slug: slot.slug, name: slot.name })}
                          className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-gray dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          + Select
                        </button>
                      </div>
                    ) : (
                      // Populated state
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Image */}
                          <div className="relative w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={product.image || "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                {product.brand}
                              </span>
                              {isSuggested && (
                                <span className="bg-purple-100 dark:bg-purple-900/35 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI Pick
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-gray dark:text-zinc-100 truncate">
                              {product.name}
                            </h4>
                            <p className="text-sm font-bold text-rust-copper mt-0.5">
                              {product.price.toLocaleString()} BDT
                            </p>
                            {isSuggested && reasoning && (
                              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1 flex items-center gap-1">
                                <Info className="h-3 w-3 flex-shrink-0" />
                                {reasoning}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          {isSuggested && (
                            <button
                              onClick={() => {
                                selectComponent(slot.slug, product, false); // clear suggestion flag
                                toast.success(`Confirmed ${product.name}!`);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 border border-emerald-200/50 cursor-pointer"
                              title="Accept suggestions"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Accept
                            </button>
                          )}
                          <button
                            onClick={() => setActivePicker({ slug: slot.slug, name: slot.name })}
                            className="bg-white hover:bg-gray-50 border border-gray-300 text-slate-gray font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => {
                              removeComponent(slot.slug);
                              toast.info(`Removed ${slot.name}`);
                            }}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-xl transition-colors cursor-pointer"
                            title="Remove component"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Peripherals */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-gray flex items-center gap-2 border-b border-gray-200 pb-2">
              <span className="bg-rust-copper text-white rounded-lg p-1 text-xs">02</span>
              PERIPHERALS
              <span className="text-xs font-medium text-gray-400">(Optional items)</span>
            </h3>

            <div className="space-y-3.5">
              {PERIPHERAL_SLOTS.map((slot) => {
                const product = selectedComponents[slot.slug];
                const SlotIcon = slot.icon;

                return (
                  <div
                    key={slot.slug}
                    className={`rounded-2xl border transition-all duration-300 ${
                      product
                        ? "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                        : "border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50/20 dark:bg-zinc-900/10 hover:bg-gray-50/50 dark:hover:bg-zinc-850/20"
                    }`}
                  >
                    {!product ? (
                      // Empty state
                      <div className="flex items-center justify-between p-5 gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500">
                            <SlotIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-gray dark:text-zinc-300">
                              {slot.name}
                            </h4>
                            <span className="text-xs text-gray-400 font-semibold mt-0.5">
                              Optional peripheral
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActivePicker({ slug: slot.slug, name: slot.name })}
                          className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-gray dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          + Select
                        </button>
                      </div>
                    ) : (
                      // Populated state
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Image */}
                          <div className="relative w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={product.image || "https://i.ibb.co.com/3mJXy3Y8/meg-PCs-hero2.png"}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                              {product.brand}
                            </span>
                            <h4 className="text-sm font-bold text-slate-gray dark:text-zinc-100 truncate">
                              {product.name}
                            </h4>
                            <p className="text-sm font-bold text-rust-copper mt-0.5">
                              {product.price.toLocaleString()} BDT
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <button
                            onClick={() => setActivePicker({ slug: slot.slug, name: slot.name })}
                            className="bg-white hover:bg-gray-50 border border-gray-300 text-slate-gray font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => {
                              removeComponent(slot.slug);
                              toast.info(`Removed ${slot.name}`);
                            }}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Sticky Summary Sidebar - Right 30% */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 shadow-md sticky top-24 space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-gray dark:text-zinc-200 border-b border-gray-150 pb-3">
                BUILD SUMMARY
              </h3>
            </div>

            {/* List of active parts */}
            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {Object.keys(selectedComponents).length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  No components selected yet.
                </p>
              ) : (
                Object.entries(selectedComponents).map(([slotSlug, product]) => {
                  const label = [...CORE_SLOTS, ...PERIPHERAL_SLOTS].find((s) => s.slug === slotSlug)?.name || slotSlug;
                  return (
                    <div key={slotSlug} className="flex justify-between items-start gap-2.5 text-xs text-slate-gray dark:text-zinc-300">
                      <div className="min-w-0">
                        <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
                        <span className="block font-medium truncate max-w-[160px]">{product.name}</span>
                      </div>
                      <span className="font-bold text-right flex-shrink-0 text-rust-copper">
                        {product.price.toLocaleString()} BDT
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Wattage bar */}
            <div className="bg-gray-50 dark:bg-zinc-850 p-4 rounded-2xl space-y-2 border border-gray-150/50 dark:border-zinc-800/40">
              <div className="flex items-center justify-between text-xs text-slate-gray dark:text-zinc-300">
                <span className="font-semibold">Estimated Power Draw:</span>
                <span className="font-bold text-rust-copper">{estWattage} W</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-gray dark:text-zinc-300">
                <span className="font-semibold">Selected PSU Output:</span>
                <span className="font-bold">
                  {psuWattage ? `${psuWattage} W` : (
                    <span className="text-[10px] text-gray-400 italic font-normal">Not Selected</span>
                  )}
                </span>
              </div>
              {!psuWattage && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 leading-normal">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 text-rust-copper" />
                  We recommend a PSU with at least <strong className="text-slate-gray">{estWattage}W</strong> output power.
                </p>
              )}
            </div>

            {/* Pricing totals */}
            <div className="pt-4 border-t border-gray-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Estimated Total</span>
                <span className="text-xl font-black text-rust-copper font-heading">
                  {totalPrice.toLocaleString()} BDT
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleFinalize}
                disabled={!isCoreCompleted}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm py-3 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title={!isCoreCompleted ? "Please select all core components first." : ""}
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                Finalize & Add to Cart
              </button>

              <button
                onClick={handleSaveBuild}
                disabled={isSaving || Object.keys(selectedComponents).length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 text-slate-gray dark:text-zinc-200 font-bold text-sm py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-gray border-t-transparent" />
                ) : (
                  <Save className="h-4.5 w-4.5" />
                )}
                Save Build Configuration
              </button>

              {Object.keys(selectedComponents).length > 0 && (
                <button
                  onClick={() => {
                    clearBuild();
                    toast.success("Build configuration cleared!");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Selections
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Product selection modal */}
      {activePicker && (
        <ProductPickerModal
          isOpen={!!activePicker}
          onClose={() => setActivePicker(null)}
          categorySlug={activePicker.slug}
          categoryName={activePicker.name}
          currentBuild={selectedComponents}
          onSelect={(product) => {
            selectComponent(activePicker.slug, product);
            toast.success(`Added ${product.name} to ${activePicker.name}!`);
          }}
        />
      )}
    </div>
  );
}
