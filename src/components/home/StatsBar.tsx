"use client";

import React, { useEffect, useRef, useState } from "react";
import { Users, Wrench, Clock, ShieldCheck } from "lucide-react";

interface Stat {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { icon: <Users className="h-7 w-7" />, value: 10, suffix: "K+", label: "Happy Customers" },
  { icon: <Wrench className="h-7 w-7" />, value: 5, suffix: "K+", label: "Builds Completed" },
  { icon: <Clock className="h-7 w-7" />, value: 24, suffix: "/7", label: "Support" },
  { icon: <ShieldCheck className="h-7 w-7" />, value: 100, suffix: "%", label: "Authentic Parts" },
];

function useCountUp(target: number, duration: number = 2000, trigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, trigger]);

  return count;
}

function StatItem({ stat, inView }: { stat: Stat; inView: boolean }) {
  const count = useCountUp(stat.value, 2000, inView);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="text-rust-copper">{stat.icon}</div>
      <div className="font-heading text-3xl md:text-4xl font-bold text-white">
        {count}
        <span>{stat.suffix}</span>
      </div>
      <span className="text-gray-300 text-sm font-medium tracking-wide">{stat.label}</span>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="bg-slate-gray py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} inView={inView} />
        ))}
      </div>
    </section>
  );
}
