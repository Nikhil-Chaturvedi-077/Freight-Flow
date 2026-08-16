"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, Loader2,
  Package, Gavel, Truck, MapPin, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";
import { updateLoadStatus } from "@/actions/load.actions";
import { useLoadStatus } from "@/hooks/use-load-status";
import { toast } from "sonner";
import type { LoadStatus } from "@prisma/client";

const TIMELINE_STEPS: {
  status: LoadStatus;
  label: string;
  desc: string;
  icon: React.ElementType;
  nextStatus?: LoadStatus;
  nextLabel?: string;
}[] = [
  {
    status: "OPEN",
    label: "Load Posted",
    desc: "Accepting bids from transporters",
    icon: Package,
  },
  {
    status: "BIDDING_CLOSED",
    label: "Bid Accepted",
    desc: "Transporter assigned, preparing for pickup",
    icon: Gavel,
    nextStatus: "IN_TRANSIT",
    nextLabel: "Mark In Transit",
  },
  {
    status: "IN_TRANSIT",
    label: "In Transit",
    desc: "Cargo on the way to destination",
    icon: Truck,
    nextStatus: "ARRIVED",
    nextLabel: "Mark Arrived",
  },
  {
    status: "ARRIVED",
    label: "Arrived",
    desc: "Cargo reached destination",
    icon: MapPin,
    nextStatus: "DELIVERED",
    nextLabel: "Confirm Delivered",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    desc: "Successfully delivered",
    icon: Star,
  },
];

const STATUS_ORDER: LoadStatus[] = [
  "OPEN", "BIDDING_CLOSED", "IN_TRANSIT", "ARRIVED", "DELIVERED",
];

interface LoadStatusTimelineProps {
  currentStatus: LoadStatus;
  createdAt: Date;
  inTransitAt: Date | null;
  deliveredAt: Date | null;
  loadId: string;
  isShipper: boolean;
}

export function LoadStatusTimeline({
  currentStatus: initialStatus,
  createdAt,
  inTransitAt,
  deliveredAt,
  loadId,
  isShipper,
}: LoadStatusTimelineProps) {
  const { status } = useLoadStatus(loadId, initialStatus);
  const [isPending, startTransition] = useTransition();

  const currentIndex = STATUS_ORDER.indexOf(status);

  function handleStatusUpdate(newStatus: LoadStatus) {
    startTransition(async () => {
      const result = await updateLoadStatus(loadId, newStatus);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    });
  }

  const currentStep = TIMELINE_STEPS.find((s) => s.status === status);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <h3 className="text-sm font-semibold">Load Timeline</h3>

      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const stepIndex = STATUS_ORDER.indexOf(step.status);
          const isDone = stepIndex < currentIndex;
          const isActive = stepIndex === currentIndex;
          const isPending_ = stepIndex > currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                  }}
                  className={cn(
                    "size-7 rounded-full flex items-center justify-center",
                    "border-2 transition-all duration-300 shrink-0",
                    isDone &&
                      "bg-emerald-500 border-emerald-500 text-white",
                    isActive &&
                      "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]",
                    isPending_ &&
                      "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)]"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </motion.div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[24px] transition-colors duration-300",
                      isDone ? "bg-emerald-500" : "bg-[var(--border)]"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isPending_ &&
                        "text-[var(--muted-foreground)]"
                    )}
                  >
                    {step.label}
                  </p>
                  {isActive && (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="size-1.5 rounded-full bg-[var(--primary)]"
                    />
                  )}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {step.desc}
                </p>

                {/* Timestamp */}
                {isDone || isActive ? (
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                    {step.status === "OPEN" && formatDateTime(createdAt)}
                    {step.status === "IN_TRANSIT" &&
                      inTransitAt &&
                      formatDateTime(inTransitAt)}
                    {step.status === "DELIVERED" &&
                      deliveredAt &&
                      formatDateTime(deliveredAt)}
                  </p>
                ) : null}

                {/* CTA for next status */}
                {isActive &&
                  isShipper &&
                  step.nextStatus && (
                    <Button
                      size="sm"
                      className="mt-2 h-7 text-xs gap-1.5"
                      onClick={() => handleStatusUpdate(step.nextStatus!)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : null}
                      {step.nextLabel}
                    </Button>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}