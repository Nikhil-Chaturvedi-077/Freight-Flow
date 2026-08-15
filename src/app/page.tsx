import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Truck, ArrowRight, Shield, Zap, TrendingDown } from "lucide-react";

export default async function HomePage() {
  await connection();
  const session = await auth();

  // Redirect logged-in users to their dashboard
  if (session?.user) {
    const role = session.user.role;
    // redirect(
    //   role === "SHIPPER"
    //     ? "/shipper"
    //     : role === "TRANSPORTER"
    //       ? "/transporter"
    //       : "/admin"
    // );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <Truck className="size-4 text-[var(--primary-foreground)]" />
          </div>
          <span className="font-semibold tracking-tight">Freight-Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login"/>}>
            Sign in
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/register"/>}>
            Get started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-[var(--muted-foreground)] mb-6">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live bidding across 142 routes
        </div>

        <h1 className="text-5xl font-semibold leading-tight mb-4">
          Freight without{" "}
          <span className="text-[var(--primary)]">middlemen</span>
        </h1>
        <p className="text-lg text-[var(--muted-foreground)] mb-8 max-w-xl">
          Post loads, receive competitive bids from verified transporters, and
          manage end-to-end delivery — all on one industrial-grade platform.
        </p>

        <div className="flex gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/register"/>} className="gap-2">
              Start for free <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login"/>}>
            Sign in
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-16 w-full text-left">
          {[
            {
              icon: TrendingDown,
              title: "Lowest bids win",
              desc: "Real-time auction engine with race-condition protection",
            },
            {
              icon: Shield,
              title: "Escrow security",
              desc: "Payments held safely until PoD confirmation",
            },
            {
              icon: Zap,
              title: "Instant updates",
              desc: "Live bid leaderboard via Socket.io",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-2"
            >
              <div className="size-8 rounded-md bg-[var(--primary)]/10 flex items-center justify-center">
                <f.icon className="size-4 text-[var(--primary)]" />
              </div>
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}