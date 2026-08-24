"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Loader2, Package,
  Hash, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  requestDeliveryOTP,
  confirmDelivery,
} from "@/actions/pod.actions";
import { toast } from "sonner";

interface PodFormProps {
  loadId: string;
  loadNumber: string;
  currentStatus: string;
}

export function PodForm({ loadId, loadNumber, currentStatus }: PodFormProps) {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConfirming, startConfirmTransition] = useTransition();

  function handleRequestOTP() {
    setError(null);
    startTransition(async () => {
      const result = await requestDeliveryOTP(loadId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // In dev: show OTP
      setDevOtp(result.data.otp);
      setStep("confirm");
      toast.success("OTP generated! Share with the receiver.");
    });
  }

  function handleConfirm() {
    if (!otp.trim() || otp.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }
    setError(null);

    startConfirmTransition(async () => {
      const result = await confirmDelivery(loadId, otp);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(`Load ${loadNumber} delivered! Payment released to your wallet.`);
    });
  }

  if (currentStatus === "DELIVERED") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center space-y-2">
        <CheckCircle className="size-8 text-emerald-500 mx-auto" />
        <p className="text-sm font-semibold text-emerald-600">
          Delivery Confirmed!
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Payment has been released to your wallet.
        </p>
      </div>
    );
  }

  if (
    currentStatus !== "IN_TRANSIT" &&
    currentStatus !== "ARRIVED" &&
    currentStatus !== "BIDDING_CLOSED"
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Package className="size-4 text-[var(--muted-foreground)]" />
        Proof of Delivery
      </h3>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {step === "request" ? (
          <motion.div
            key="request"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <p className="text-xs text-[var(--muted-foreground)]">
              When you reach the delivery location, generate an OTP and
              ask the receiver to verify it.
            </p>
            <Button
              onClick={handleRequestOTP}
              disabled={isPending}
              className="w-full gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Hash className="size-4" />
              )}
              {isPending ? "Generating OTP…" : "Generate Delivery OTP"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Dev OTP display */}
            {devOtp && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-xs text-amber-600 font-medium mb-1">
                  🔑 Share this OTP with receiver (Dev mode)
                </p>
                <p className="text-2xl font-bold tracking-[0.3em] text-amber-600">
                  {devOtp}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">
                Enter OTP received from receiver
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={cn(
                  "text-center text-xl font-bold tracking-[0.3em] h-12",
                  error && "border-destructive"
                )}
                disabled={isConfirming}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setStep("request");
                  setDevOtp(null);
                  setOtp("");
                  setError(null);
                }}
                disabled={isConfirming}
              >
                Back
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirm}
                disabled={isConfirming || otp.length !== 6}
              >
                {isConfirming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                {isConfirming ? "Confirming…" : "Confirm Delivery"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}