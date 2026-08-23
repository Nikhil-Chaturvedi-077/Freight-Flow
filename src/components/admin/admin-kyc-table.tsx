"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, Loader2,
  Phone, Building2, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateKYCStatus } from "@/actions/kyc.actions";
import { toast } from "sonner";
import { cn, formatRelative } from "@/lib/utils";
import type { KYCStatus } from "@prisma/client";

const KYC_BADGE = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  gstNumber: string | null;
  kycStatus: KYCStatus;
  createdAt: Date;
  transporterProfile: {
    vehicleNumber: string | null;
    vehicleType: string | null;
    capacity: number | null;
    totalTrips: number;
    rating: number;
  } | null;
  _count: { bids: number };
}

export function AdminKYCTable({ users }: { users: User[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleKYC(
    userId: string,
    status: "VERIFIED" | "REJECTED"
  ) {
    setLoadingId(userId);
    startTransition(async () => {
      const result = await updateKYCStatus(userId, status);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(
          status === "VERIFIED"
            ? "KYC approved ✓"
            : "KYC rejected"
        );
      }
      setLoadingId(null);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        {[
          { label: "Transporter", span: 3 },
          { label: "Company", span: 2 },
          { label: "Vehicle", span: 3 },
          { label: "KYC Status", span: 2 },
          { label: "Actions", span: 2 },
        ].map((h) => (
          <div
            key={h.label}
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
              `col-span-${h.span}`
            )}
          >
            {h.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--border)]">
        {users.map((user, index) => {
          const isLoading = loadingId === user.id;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                "grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5",
                "hover:bg-[var(--muted)]/20 transition-colors",
                isLoading && "opacity-60"
              )}
            >
              {/* Transporter */}
              <div className="md:col-span-3">
                <p className="text-sm font-medium">
                  {user.name ?? "Unknown"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {user.email}
                </p>
                {user.phone && (
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                    <Phone className="size-2.5" />
                    {user.phone}
                  </div>
                )}
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  Joined {formatRelative(user.createdAt)} ·{" "}
                  {user._count.bids} bids
                </p>
              </div>

              {/* Company */}
              <div className="md:col-span-2">
                {user.companyName ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3 text-[var(--muted-foreground)]" />
                      <p className="text-xs font-medium">
                        {user.companyName}
                      </p>
                    </div>
                    {user.gstNumber && (
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-mono">
                        {user.gstNumber}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Not provided
                  </p>
                )}
              </div>

              {/* Vehicle */}
              <div className="md:col-span-3">
                {user.transporterProfile ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="size-3 text-[var(--muted-foreground)]" />
                      <p className="text-xs font-medium font-mono">
                        {user.transporterProfile.vehicleNumber ?? "—"}
                      </p>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {user.transporterProfile.vehicleType ?? "—"} ·{" "}
                      {user.transporterProfile.capacity ?? "—"} MT
                    </p>
                    {user.transporterProfile.totalTrips > 0 && (
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        ⭐ {user.transporterProfile.rating.toFixed(1)} ·{" "}
                        {user.transporterProfile.totalTrips} trips
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Profile incomplete
                  </p>
                )}
              </div>

              {/* KYC Status */}
              <div className="md:col-span-2 flex items-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                    KYC_BADGE[user.kycStatus]
                  )}
                >
                  {user.kycStatus}
                </span>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex items-center gap-2">
                {user.kycStatus !== "VERIFIED" && (
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleKYC(user.id, "VERIFIED")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <CheckCircle className="size-3" />
                    )}
                    Approve
                  </Button>
                )}
                {user.kycStatus !== "REJECTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleKYC(user.id, "REJECTED")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <XCircle className="size-3" />
                    )}
                    Reject
                  </Button>
                )}
                {user.kycStatus === "VERIFIED" && (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}