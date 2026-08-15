"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye, EyeOff, Loader2, Truck, Package,
  Building2, Phone, Mail, Lock, User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { registerUser } from "@/actions/auth.actions";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain a number"),
  role: z.enum(["SHIPPER", "TRANSPORTER"]),
  companyName: z.string().min(2, "Company name required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  gstNumber: z.string().optional(),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

const ROLES = [
  {
    value: "SHIPPER" as const,
    label: "Shipper",
    description: "Post loads & find transporters",
    icon: Package,
  },
  {
    value: "TRANSPORTER" as const,
    label: "Transporter",
    description: "Bid on loads & earn more",
    icon: Truck,
  },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: "SHIPPER" },
  });

  const selectedRole = watch("role");

  function onSubmit(data: RegisterInput) {
    setError(null);
    startTransition(async () => {
      const result = await registerUser(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Auto-login after registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login?registered=true");
        return;
      }

      router.push(data.role === "SHIPPER" ? "/shipper" : "/transporter");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Role Selector */}
      <div className="space-y-1.5">
        <Label>I am a</Label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setValue("role", role.value)}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]"
                    : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  )}
                >
                  {role.label}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {role.description}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="role-indicator"
                    className="absolute right-2 top-2 size-2 rounded-full bg-[var(--primary)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name + Company in a row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
            <Input
              id="name"
              placeholder="Rahul Sharma"
              disabled={isPending}
              className={cn("pl-8", errors.name && "border-destructive")}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
            <Input
              id="companyName"
              placeholder="Acme Logistics"
              disabled={isPending}
              className={cn("pl-8", errors.companyName && "border-destructive")}
              {...register("companyName")}
            />
          </div>
          {errors.companyName && (
            <p className="text-xs text-destructive">
              {errors.companyName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            disabled={isPending}
            className={cn("pl-8", errors.email && "border-destructive")}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Phone + GST */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              disabled={isPending}
              className={cn("pl-8", errors.phone && "border-destructive")}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gstNumber">
            GST number{" "}
            <span className="text-[var(--muted-foreground)] font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="gstNumber"
            placeholder="22AAAAA0000A1Z5"
            disabled={isPending}
            className="uppercase"
            {...register("gstNumber")}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            autoComplete="new-password"
            disabled={isPending}
            className={cn(
              "pl-8 pr-10",
              errors.password && "border-destructive"
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Password strength indicator */}
      <AnimatePresence>
        {watch("password")?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <div className="flex gap-1">
              {[
                watch("password")?.length >= 8,
                /[A-Z]/.test(watch("password") ?? ""),
                /[0-9]/.test(watch("password") ?? ""),
                watch("password")?.length >= 12,
              ].map((met, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    met ? "bg-emerald-500" : "bg-[var(--border)]"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Use 8+ characters with uppercase and numbers
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : null}
        {isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        By creating an account you agree to our{" "}
        <span className="text-[var(--primary)] cursor-pointer hover:underline">
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="text-[var(--primary)] cursor-pointer hover:underline">
          Privacy Policy
        </span>
      </p>
    </form>
  );
}