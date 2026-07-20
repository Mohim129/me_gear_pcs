"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in Name, Email, and Message.");
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, send to an API endpoint; for now simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="border-b border-gray-200/80 pb-6 mb-8">
        <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-rust-copper" />
          GET IN TOUCH
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Have a question or need help with your build? We&apos;re here for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahim Ahmed"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. rahim@example.com"
                  className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Build consultation"
                className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Message *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-rust-copper hover:bg-rust-copper/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-heading font-bold text-slate-900 dark:text-zinc-200 text-lg">
              Contact Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rust-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-rust-copper" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-200">
                    Our Office
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    House 24, Road 7, Dhanmondi
                    <br />
                    Dhaka 1205, Bangladesh
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rust-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-rust-copper" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-200">
                    Phone
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    +880 1712-345678
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rust-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-rust-copper" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-200">
                    Email
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    support@megears.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rust-copper/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-rust-copper" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-200">
                    Support Hours
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Saturday – Thursday: 10 AM – 8 PM
                    <br />
                    Friday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="bg-gray-200 dark:bg-zinc-800 rounded-2xl h-48 flex items-center justify-center border border-gray-200 dark:border-zinc-700">
            <div className="text-center text-gray-400">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs font-semibold">Map Placeholder</p>
              <p className="text-xs">Dhanmondi, Dhaka</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
