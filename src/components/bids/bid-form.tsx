"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Gavel, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn, formatCurrency, formatCountdown } from "@/lib/utils";
import { placeBid } from "@/actions/bid.actions";
import { BID_RATE_LIMIT_SECONDS } from "@/lib/constants";
import { toast } from "sonner";

const Schema = z.object({
  amount: z.coerce
    .number()
    .positive("Bid amount must be positive"),
  note: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

interface BidFormProps {
  loadId: string;
  loadNumber: string;
  lowestBid: number | null;
  biddingClosesAt: Date;
  existingBid: { amount: number; lastModifiedAt: Date } | null;
}

export function BidForm({
  loadId,
  loadNumber,
  lowestBid,
  biddingClosesAt,
  existingBid,
}: BidFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [countdown, setCountdown] = useState(
    formatCountdown(biddingClosesAt)
  );

  // Bid countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(biddingClosesAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [biddingClosesAt]);

  // Rate limit cooldown
  useEffect(() => {
    if (!existingBid) return;

    const elapsed =
      (Date.now() - existingBid.lastModifiedAt.getTime()) / 1000;
    const remaining = Math.max(0, BID_RATE_LIMIT_SECONDS - elapsed);
    setCooldown(Math.ceil(remaining));

    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [existingBid]);

  const isClosed = new Date(biddingClosesAt) <= new Date();
  const isOnCooldown = cooldown > 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      amount: existingBid?.amount ?? lowestBid ?? undefined,
    },
  });

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await placeBid({
        loadId,
        amount: data.amount,
        note: data.note,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(
        existingBid ? "Bid updated!" : "Bid placed!",
        {
          description: `₹${data.amount.toLocaleString("en-IN")} on ${loadNumber}`,
        }
      );
    });
  }

  if (isClosed) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
        <Clock className="size-5 text-[var(--muted-foreground)] mx-auto mb-2" />
        <p className="text-sm font-medium">Bidding Closed</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          This load is no longer accepting bids
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="size-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">
            {existingBid ? "Update Your Bid" : "Place a Bid"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Clock className="size-3" />
          <span className={cn(countdown === "Closed" && "text-red-500")}>
            {countdown}
          </span>
        </div>
      </div>

      {lowestBid && (
        <div className="flex items-center justify-between rounded-lg bg-[var(--muted)]/50 px-3 py-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            Current lowest bid
          </span>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(lowestBid)}
          </span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Your Bid Amount (₹) *</Label>
          <Input
            type="number"
            step="100"
            min="1"
            placeholder="Enter your bid"
            disabled={isPending || isOnCooldown}
            className={cn(
              "text-base font-semibold",
              errors.amount && "border-destructive"
            )}
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">
            Note{" "}
            <span className="text-[var(--muted-foreground)]">(optional)</span>
          </Label>
          <Textarea
            placeholder="Any relevant info for the shipper..."
            rows={2}
            className="resize-none text-sm"
            disabled={isPending || isOnCooldown}
            {...register("note")}
          />
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isPending || isOnCooldown}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isOnCooldown ? (
            <Clock className="size-4" />
          ) : (
            <Gavel className="size-4" />
          )}
          {isPending
            ? "Placing bid…"
            : isOnCooldown
            ? `Wait ${cooldown}s to modify bid`
            : existingBid
            ? "Update Bid"
            : "Place Bid"}
        </Button>

        {existingBid && (
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Current bid:{" "}
            <span className="font-medium">
              {formatCurrency(existingBid.amount)}
            </span>
          </p>
        )}
      </form>
    </div>
  );
}