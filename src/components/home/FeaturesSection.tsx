import React from "react";
import { Award, PuzzleIcon, Truck, Headset } from "lucide-react";

const features = [
  {
    icon: <Award className="h-8 w-8" />,
    title: "Expertly Curated",
    description: "We handpick the best components for your needs. Every product in our store meets our rigorous quality standards.",
  },
  {
    icon: <PuzzleIcon className="h-8 w-8" />,
    title: "Compatibility Guaranteed",
    description: "Our builder ensures every part fits perfectly. No guesswork, no returns — just a seamless build experience.",
  },
  {
    icon: <Truck className="h-8 w-8" />,
    title: "Fast Delivery",
    description: "Free shipping across Bangladesh. Most orders are delivered within 2-3 business days to your doorstep.",
  },
  {
    icon: <Headset className="h-8 w-8" />,
    title: "24/7 Tech Support",
    description: "Our experts are always ready to help. Get assistance with builds, troubleshooting, or product recommendations anytime.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
            Why MEG PCs?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We are committed to delivering the best PC building experience in Bangladesh
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 hover:bg-warm-cream"
            >
              <div className="mb-4 flex items-center justify-center rounded-2xl bg-rust-copper/10 p-4 text-rust-copper transition-colors group-hover:bg-rust-copper group-hover:text-white">
                {feature.icon}
              </div>
              <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-zinc-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
