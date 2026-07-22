"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  PlusCircle,
  MinusCircle,
  FileText,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  brand: string;
  description?: string;
  price: number;
  originalPrice: number;
  stock: number;
  category: { name: string; slug: string };
  image: string;
  images: string[];
  features: string[];
  specifications: Record<string, any>;
}

// Map category slug -> dynamic spec fields
const SPEC_FIELDS: Record<string, string[]> = {
  cpu: ["socket", "tdp", "cores", "threads", "clock_speed"],
  gpu: ["vram", "tdp", "clock_speed"],
  motherboard: ["socket", "memory_type", "form_factor"],
  ram: ["memory_type", "capacity", "speed"],
  storage: ["interface", "capacity", "type"],
  psu: ["wattage", "efficiency"],
  casing: ["motherboard_support"], // Array checkboxes
  cooler: ["socket_support", "type", "radiator_size"], // socket_support checkboxes, type dropdown, radiator_size conditional
  monitor: ["resolution", "refresh_rate"],
  keyboard: ["type", "connectivity"],
  mouse: ["sensor", "weight"],
  speaker: ["type", "power"],
  headphone: ["type", "noise_cancelling"],
  "pre-built-pc": ["cpu", "gpu", "ram"],
  laptop: ["cpu", "gpu", "ram"],
};

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Uploading indicators
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState<{ name: string; slug: string } | null>(null);
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formPrimaryImage, setFormPrimaryImage] = useState("");
  const [formAdditionalImages, setFormAdditionalImages] = useState<string[]>([]);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [formSpecs, setFormSpecs] = useState<Record<string, any>>({});
  
  // Custom specification state for categories not in the standard spec map
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string }>>([]);

  // Fetch categories from API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  // Fetch products from Admin API
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["adminProducts", search, activeCategory],
    queryFn: async () => {
      const url = `/api/admin/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch product catalog.");
      return res.json();
    },
  });

  // Product mutation (Add / Edit)
  const productMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct._id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Product modification failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      toast.success(editingProduct ? "Product updated successfully!" : "Product added successfully!");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update product.");
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      toast.success("Product deleted successfully!");
      setIsDeletingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product.");
    },
  });

  // Reset form inputs
  const resetForm = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku("");
    setFormBrand("");
    setFormCategory(null);
    setFormShortDesc("");
    setFormPrice("");
    setFormOriginalPrice("");
    setFormStock("");
    setFormPrimaryImage("");
    setFormAdditionalImages([]);
    setFormFeatures([]);
    setFormSpecs({});
    setCustomSpecs([]);
  };

  // Open Form for Add
  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || "");
    setFormBrand(product.brand || "");
    setFormCategory(product.category);
    setFormShortDesc(product.description || "");
    setFormPrice(product.price.toString());
    setFormOriginalPrice(product.originalPrice?.toString() || product.price.toString());
    setFormStock(product.stock.toString());
    setFormPrimaryImage(product.image);
    setFormAdditionalImages(product.images ? product.images.filter(img => img !== product.image) : []);
    setFormFeatures(product.features || []);
    
    // Parse specs
    const catSlug = product.category.slug;
    const specFields = SPEC_FIELDS[catSlug];
    if (specFields) {
      setFormSpecs(product.specifications || {});
      setCustomSpecs([]);
    } else {
      setFormSpecs({});
      const specPairs = Object.entries(product.specifications || {}).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCustomSpecs(specPairs);
    }
    setIsFormOpen(true);
  };

  // Handle client-side image upload to imgBB
  const handleImageUpload = async (file: File, type: "primary" | "additional") => {
    const apiKey = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API;
    if (!apiKey) {
      toast.error("ImgBB upload API key is missing in environmental configurations.");
      return;
    }

    if (type === "primary") setIsUploadingPrimary(true);
    if (type === "additional") setIsUploadingAdditional(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error("imgBB upload rejected");

      const uploadedUrl = data.data.url;

      if (type === "primary") {
        setFormPrimaryImage(uploadedUrl);
        toast.success("Primary image uploaded!");
      } else if (type === "additional") {
        setFormAdditionalImages(prev => [...prev, uploadedUrl]);
        toast.success("Additional image added!");
      }
    } catch (e) {
      toast.error("Image upload failed. Please verify network or key.");
    } finally {
      setIsUploadingPrimary(false);
      setIsUploadingAdditional(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice || !formCategory) {
      toast.error("Please fill in name, price, and category.");
      return;
    }

    // Compile dynamic specifications
    let finalSpecs: Record<string, any> = {};
    const catSlug = formCategory.slug;
    const specFields = SPEC_FIELDS[catSlug];

    if (specFields) {
      specFields.forEach(field => {
        if (formSpecs[field] !== undefined) {
          finalSpecs[field] = formSpecs[field];
        }
      });
    } else {
      // Custom category - build specs from customSpec key-value pairs
      customSpecs.forEach(pair => {
        if (pair.key.trim()) {
          finalSpecs[pair.key.trim()] = pair.value;
        }
      });
    }

    // Combine primary and additional images
    const allImages = [formPrimaryImage || "/images/placeholder.jpg", ...formAdditionalImages.filter(img => img.trim())];

    const payload = {
      name: formName,
      sku: formSku,
      brand: formBrand,
      description: formShortDesc,
      price: Number(formPrice),
      originalPrice: Number(formOriginalPrice || formPrice),
      stock: Number(formStock || 0),
      category: formCategory,
      image: formPrimaryImage || "/images/placeholder.jpg",
      images: allImages,
      features: formFeatures.filter(f => f.trim()),
      specifications: finalSpecs,
    };

    productMutation.mutate(payload);
  };

  // Helper to handle specs checkbox updates
  const handleCheckboxChange = (field: string, option: string, checked: boolean) => {
    const current = Array.isArray(formSpecs[field]) ? formSpecs[field] : [];
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter((o: string) => o !== option);
    }
    setFormSpecs(prev => ({
      ...prev,
      [field]: updated,
    }));
  };

  // Dynamic Specs Form Renderer
  const renderSpecsForm = () => {
    if (!formCategory) return null;

    const catSlug = formCategory.slug;
    
    // Casing Checklist Spec
    if (catSlug === "casing") {
      const casingOptions = ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"];
      const currentSupport = Array.isArray(formSpecs.motherboard_support) ? formSpecs.motherboard_support : [];
      return (
        <div className="space-y-2">
          <label className="font-bold text-gray-400 uppercase tracking-wide">Motherboard Form Factor Support</label>
          <div className="flex flex-wrap gap-4 pt-1">
            {casingOptions.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-zinc-150 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSupport.includes(opt)}
                  onChange={(e) => handleCheckboxChange("motherboard_support", opt, e.target.checked)}
                  className="rounded border-gray-300 text-rust-copper focus:ring-rust-copper h-4.5 w-4.5"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // Cooler Spec
    if (catSlug === "cooler") {
      const socketOptions = ["LGA1700", "AM5", "AM4", "LGA1200", "LGA1151", "AM3", "LGA2066"];
      const currentSockets = Array.isArray(formSpecs.socket_support) ? formSpecs.socket_support : [];
      const coolerType = formSpecs.type || "Air Cooler";
      
      return (
        <div className="space-y-4">
          {/* Socket support checkboxes */}
          <div className="space-y-2">
            <label className="font-bold text-gray-400 uppercase tracking-wide">Socket Support</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {socketOptions.map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-zinc-150 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSockets.includes(opt)}
                    onChange={(e) => handleCheckboxChange("socket_support", opt, e.target.checked)}
                    className="rounded border-gray-300 text-rust-copper focus:ring-rust-copper h-4.5 w-4.5"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-400 uppercase tracking-wide">Cooler Type</label>
              <select
                value={coolerType}
                onChange={(e) => setFormSpecs(prev => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
              >
                <option value="Air Cooler">Air Cooler</option>
                <option value="Liquid Cooler (AIO)">Liquid Cooler (AIO)</option>
              </select>
            </div>

            {/* Conditionally show radiator size if liquid cooler */}
            {coolerType.includes("Liquid") && (
              <div className="space-y-1 animate-fade-in">
                <label className="font-bold text-gray-400 uppercase tracking-wide">Radiator Size</label>
                <input
                  type="text"
                  value={formSpecs.radiator_size || ""}
                  onChange={(e) => setFormSpecs(prev => ({ ...prev, radiator_size: e.target.value }))}
                  placeholder="e.g. 240mm, 360mm"
                  className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-1.5 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Standard list input specifications
    const fields = SPEC_FIELDS[catSlug];
    if (fields) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field} className="space-y-1">
              <label className="font-bold text-gray-400 capitalize">{field.replace("_", " ")}</label>
              <input
                type="text"
                value={formSpecs[field] || ""}
                onChange={(e) => {
                  setFormSpecs(prev => ({
                    ...prev,
                    [field]: e.target.value,
                  }));
                }}
                placeholder={`Enter ${field.replace("_", " ")}`}
                className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-1.5 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
              />
            </div>
          ))}
        </div>
      );
    }

    // Fallback dynamic spec builder (unmapped categories)
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-bold">Custom specifications (key-value builder)</span>
          <button
            type="button"
            onClick={() => setCustomSpecs(prev => [...prev, { key: "", value: "" }])}
            className="text-rust-copper font-bold text-xs flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Add Attribute
          </button>
        </div>
        
        <div className="space-y-2.5">
          {customSpecs.map((pair, idx) => (
            <div key={idx} className="flex gap-2 items-center animate-fade-in">
              <input
                type="text"
                value={pair.key}
                onChange={(e) => {
                  setCustomSpecs(prev => {
                    const copied = [...prev];
                    copied[idx].key = e.target.value;
                    return copied;
                  });
                }}
                placeholder="Spec Key (e.g. interface)"
                className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-2.5 py-1.5 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
              />
              <input
                type="text"
                value={pair.value}
                onChange={(e) => {
                  setCustomSpecs(prev => {
                    const copied = [...prev];
                    copied[idx].value = e.target.value;
                    return copied;
                  });
                }}
                placeholder="Spec Value (e.g. SATA III)"
                className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-2.5 py-1.5 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCustomSpecs(prev => prev.filter((_, cidx) => cidx !== idx))}
                className="text-red-500 hover:text-red-650 p-1 cursor-pointer"
              >
                <MinusCircle className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-zinc-100 dark:text-zinc-150 leading-none">Catalog Inventory</h1>
          <p className="text-xs text-gray-500 mt-1">Manage catalog listings, search, delete, update specs, and upload item images.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name, brand, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-350 dark:border-zinc-700 bg-white dark:bg-zinc-850 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-rust-copper/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setActiveCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === "All"
                ? "bg-rust-copper text-white"
                : "bg-gray-50 hover:bg-gray-100 text-slate-900 dark:text-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.slug
                  ? "bg-rust-copper text-white"
                  : "bg-gray-50 hover:bg-gray-100 text-slate-900 dark:text-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-250/70 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-rust-copper animate-spin" />
            <p className="text-xs text-gray-500 mt-3 font-medium">Loading inventory data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-500 font-semibold">
            {error?.message || "Failed to load product inventory."}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 font-medium">
            No products found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-zinc-950/20 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-250 dark:border-zinc-800">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price (BDT)</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/80">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-zinc-100 dark:text-zinc-200 truncate max-w-[280px]">{product.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono">SKU: {product.sku || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100 dark:text-zinc-350">{product.brand}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-gray/10 text-slate-900 dark:text-zinc-100 border border-slate-gray/15">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100 dark:text-zinc-250">
                      ৳{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${
                        product.stock > 10 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : product.stock > 0 
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {product.stock === 0 ? "Out of Stock" : `${product.stock} in stock`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 cursor-pointer"
                          title="Edit product"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setIsDeletingId(product._id)}
                          className="p-1.5 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-heading font-bold text-base leading-none">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to remove this product from the inventory catalog? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(isDeletingId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-slate-gray text-white">
              <h3 className="font-heading font-bold text-base leading-none">
                {editingProduct ? "Edit Catalog Item" : "Add Catalog Item"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-900 dark:text-zinc-100 dark:text-zinc-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: General Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. AMD Ryzen 9 7900X"
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 uppercase">SKU Code</label>
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="Auto-generated if empty"
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 uppercase">Brand</label>
                      <input
                        type="text"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="e.g. Intel, ASUS"
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Category</label>
                    <select
                      value={formCategory?.slug || ""}
                      onChange={(e) => {
                        const selectedSlug = e.target.value;
                        const matchedCat = categories.find(c => c.slug === selectedSlug);
                        setFormCategory(matchedCat ? { name: matchedCat.name, slug: matchedCat.slug } : null);
                        // Reset specs values when category changes
                        setFormSpecs({});
                        setCustomSpecs([]);
                      }}
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2.5 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                    >
                      <option value="">Select a category</option>
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Short Description</label>
                    <textarea
                      value={formShortDesc}
                      onChange={(e) => setFormShortDesc(e.target.value)}
                      placeholder="Describe highlights in 1-2 sentences..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                    />
                  </div>

                  {/* Features Bullet List */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-gray-400 uppercase">Features Highlight</label>
                      <button
                        type="button"
                        onClick={() => setFormFeatures(prev => [...prev, ""])}
                        className="text-rust-copper font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add feature
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formFeatures.map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={f}
                            onChange={(e) => {
                              const updated = [...formFeatures];
                              updated[i] = e.target.value;
                              setFormFeatures(updated);
                            }}
                            placeholder="e.g. DDR5 Memory Support"
                            className="flex-1 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-1.5 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setFormFeatures(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-650 p-1 cursor-pointer"
                          >
                            <MinusCircle className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Pricing, Images, Specs */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-150 dark:border-zinc-800 md:pl-6 pt-6 md:pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 uppercase">Base Price</label>
                      <input
                        type="number"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="৳ Price"
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 uppercase">Original Price</label>
                      <input
                        type="number"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(e.target.value)}
                        placeholder="৳ Strikeout"
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-400 uppercase">Stock Qty</label>
                      <input
                        type="number"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="Stock"
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 px-3 py-2 text-slate-900 dark:text-zinc-100 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Primary Image Upload Preview Container */}
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase">Primary Image</label>
                    {formPrimaryImage ? (
                      <div className="relative w-full h-32 rounded-xl bg-gray-50 border border-gray-300 overflow-hidden flex items-center justify-center group">
                        <img src={formPrimaryImage} alt="Primary Preview" className="object-contain w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setFormPrimaryImage("")}
                          className="absolute top-2 right-2 bg-red-650 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 transition-all cursor-pointer"
                          title="Remove Image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl w-full h-32 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100/50 transition-all">
                        {isUploadingPrimary ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <Loader2 className="h-6 w-6 text-rust-copper animate-spin" />
                            <span className="text-[10px] text-gray-400 font-medium">Uploading to imgBB...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-gray-450 mb-1" />
                            <span className="text-[10px] text-gray-500 font-bold">Upload Primary Image</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingPrimary}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "primary");
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Additional Images Grid with Uploader */}
                  <div className="space-y-2">
                    <label className="font-bold text-gray-400 uppercase">Additional Images</label>
                    <div className="grid grid-cols-4 gap-3">
                      {formAdditionalImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center group">
                          <img src={img} alt={`Additional ${idx}`} className="object-contain w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setFormAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-1 shadow-xs hover:bg-red-700 transition-all cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload new additional file slot */}
                      <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-gray-100/50 transition-all">
                        {isUploadingAdditional ? (
                          <Loader2 className="h-5 w-5 text-rust-copper animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-5 w-5 text-gray-400" />
                            <span className="text-[8px] text-gray-405 font-bold uppercase mt-0.5">Add File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingAdditional}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "additional");
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Category Specifications Section */}
                  {formCategory && (
                    <div className="bg-gray-50/50 dark:bg-zinc-950/15 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                      <h4 className="font-heading font-bold text-slate-900 dark:text-zinc-100 dark:text-zinc-200 flex items-center gap-1.5 border-b border-gray-200 pb-1.5 uppercase tracking-wider text-[10px]">
                        <FileText className="h-4 w-4 text-rust-copper" />
                        Category Specifications
                      </h4>
                      {renderSpecsForm()}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 text-right">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-slate-900 dark:text-zinc-100 font-bold hover:bg-gray-50 mr-3 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productMutation.isPending}
                  className="bg-rust-copper hover:bg-rust-copper/90 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs disabled:opacity-55"
                >
                  {productMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingProduct ? "Update Product details" : "Add Product to catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
