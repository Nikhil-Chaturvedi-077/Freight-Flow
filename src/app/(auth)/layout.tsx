import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Auth",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col bg-[var(--card)] border-r border-[var(--border)] p-10 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 z-10">
          <div className="size-9 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <Truck className="size-5 text-[var(--primary-foreground)]" />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            Freight-Flow
          </span>
        </Link>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center z-10 max-w-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
                Industrial Bidding Engine
              </p>
              <h1 className="text-3xl font-semibold leading-tight">
                Direct loads.
                <br />
                No middlemen.
                <br />
                <span className="text-[var(--primary)]">Real margins.</span>
              </h1>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Connect shippers and verified transporters through a transparent,
              real-time auction platform built for Indian freight.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { value: "2,400+", label: "Active Loads" },
                { value: "18K+", label: "Transporters" },
                { value: "94%", label: "On-time Rate" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-xl font-semibold text-[var(--foreground)]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom badge */}
        <div className="z-10 flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-[var(--muted-foreground)]">
            Live bidding across 142 routes
          </span>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex lg:hidden items-center gap-2 mb-8 justify-center"
          >
            <div className="size-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <Truck className="size-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-semibold tracking-tight">Freight-Flow</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}