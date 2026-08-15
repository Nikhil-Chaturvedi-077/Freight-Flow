import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Create your account</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Join thousands of shippers and transporters
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--primary)] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}