import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Sign in to your Freight-Flow account
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[var(--primary)] hover:underline font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}