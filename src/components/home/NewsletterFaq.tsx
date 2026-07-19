"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "How does the PC Builder work?",
    answer: "Our interactive PC Builder allows you to choose components category by category. It automatically checks for physical and technical compatibility between parts (e.g. CPU socket match, power supply headroom, casing clearances) so you can build with total peace of mind.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept Cash on Delivery (COD) across Bangladesh, mobile financial services (bKash, Nagad, Rocket), major debit/credit cards, and EMI options through partner banks for purchases exceeding ৳10,000.",
  },
  {
    question: "What is the warranty policy?",
    answer: "Every individual component carries its official brand-authorized warranty (ranging from 1 year to limited lifetime depending on the component). For custom pre-built systems, we provide an additional 1-year free hardware troubleshooting and assembly service warranty.",
  },
  {
    question: "Do you deliver outside Dhaka?",
    answer: "Yes, we ship across all 64 districts of Bangladesh using premium courier services. All component shipments are covered by transit insurance, and packaging is heavily reinforced with double-layered bubble wrap and custom-sized crates for safety.",
  },
];

export default function NewsletterFaq() {
  const [email, setEmail] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Subscribed successfully! Welcome to the MEG PCs newsletter.");
      setEmail("");
    }
  };

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Newsletter Sign-up */}
          <div className="space-y-6 bg-warm-cream p-8 md:p-10 rounded-3xl border border-gray-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rust-copper/10 text-rust-copper mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-slate-gray">
              Stay Updated
            </h3>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Get notified about new product arrivals, exclusive builds, discounts, and tech guides. No spam, we promise.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full rounded-xl border border-gray-300/80 bg-white py-3.5 pl-4 pr-12 text-sm text-slate-gray focus:outline-none focus:ring-2 focus:ring-rust-copper/50 focus:border-rust-copper transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-rust-copper px-5 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-rust-copper/90 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
              >
                Subscribe Now
              </button>
            </form>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="space-y-6">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-slate-gray text-center lg:text-left">
              Frequently Asked Questions
            </h3>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-gray-200/80 rounded-2xl bg-white overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left font-heading font-semibold text-slate-gray hover:text-rust-copper transition-colors focus:outline-none"
                    >
                      <span className="text-sm md:text-base">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-rust-copper" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-48 border-t border-gray-100" : "max-h-0"
                      } overflow-hidden`}
                    >
                      <div className="p-5 text-sm text-gray-500 leading-relaxed bg-warm-cream/30">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
