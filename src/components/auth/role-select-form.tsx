"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Truck, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setUserRole } from "@/actions/role.actions";
import { toast } from "sonner";

const ROLES = [
  {
    value: "SHIPPER" as const,
    icon: Package,
    label: "Shipper",
    description: "I want to post loads and find transporters",
    features: [
      "Post unlimited loads",
      "Receive competitive bids",
      "Track deliveries in real-time",
      "Generate GST invoices",
    ],
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    ring: "ring-blue-500",
  },
  {
    value: "TRANSPORTER" as const,
    icon: Truck,
    label: "Transporter",
    description: "I want to bid on loads and earn more",
    features: [
      "Browse open loads",
      "Place competitive bids",
      "Track your earnings",
      "Build your rating",
    ],
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500",
    ring: "ring-emerald-500",
  },
];

export function RoleSelectForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<"SHIPPER" | "TRANSPORTER" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!selected) return;

    startTransition(async () => {
      const result = await setUserRole(selected);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Welcome to Freight-Flow as a ${selected.toLowerCase()}!`);

      // Force session refresh and redirect
      router.push(selected === "SHIPPER" ? "/shipper" : "/transporter");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Role cards */}
      <div className="grid grid-cols-1 gap-3">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.value;

          return (
            <motion.button
              key={role.value}
              type="button"
              onClick={() => setSelected(role.value)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-xl text-left",
                "border-2 transition-all duration-150",
                isSelected
                  ? `${role.border} ${role.bg} ring-1 ${role.ring}`
                  : "border-[var(--border)] hover:border-[var(--primary)]/40"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "size-11 rounded-xl flex items-center justify-center shrink-0",
                  isSelected ? role.bg : "bg-[var(--muted)]"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isSelected
                      ? role.color
                      : "text-[var(--muted-foreground)]"
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isSelected
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]"
                    )}
                  >
                    {role.label}
                  </p>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {role.features.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]"
                    >
                      <CheckCircle
                        className={cn(
                          "size-2.5 shrink-0",
                          isSelected
                            ? role.color
                            : "text-[var(--muted-foreground)]"
                        )}
                      />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "absolute top-3 right-3 size-5 rounded-full",
                    "flex items-center justify-center",
                    role.bg
                  )}
                >
                  <CheckCircle className={cn("size-3.5", role.color)} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button */}
      <Button
        className="w-full gap-2"
        disabled={!selected || isPending}
        onClick={handleConfirm}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        {isPending
          ? "Setting up your account…"
          : selected
          ? `Continue as ${selected === "SHIPPER" ? "Shipper" : "Transporter"}`
          : "Select a role to continue"}
      </Button>

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        You can contact support to change your role later.
      </p>
    </div>
  );
}