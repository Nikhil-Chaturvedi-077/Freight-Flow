"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Package, Settings2, Clock,
  Loader2, ArrowRight, ArrowLeft,
  AlertTriangle, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  MATERIAL_TYPES, PACKAGING_TYPES,
} from "@/lib/constants";
import { createLoad } from "@/actions/load.actions";
import { toast } from "sonner";
import { Route } from "next";

const Schema = z.object({
  pickupAddress: z.string().min(5, "Pickup address required"),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropAddress: z.string().min(5, "Drop address required"),
  dropLat: z.number().optional(),
  dropLng: z.number().optional(),
  materialType: z.enum([
    "STEEL", "PHARMA", "AGRI", "MACHINERY",
    "ELECTRONICS", "CHEMICALS", "TEXTILE", "FMCG", "OTHER",
  ]),
  packagingType: z.enum([
    "PALLETS", "CRATES", "LOOSE", "DRUMS", "BAGS", "BOXES",
  ]),
  weight: z.coerce.number().positive("Weight must be positive"),
  description: z.string().optional(),
  specialInstructions: z.string().optional(),
  isFragile: z.boolean().default(false),
  isTarpRequired: z.boolean().default(false),
  labourRequired: z.boolean().default(false),
  basePrice: z.coerce.number().positive().optional().or(z.literal("")),
  biddingClosesAt: z.string().min(1, "Bidding close time required"),
});

type FormInput = z.input<typeof Schema>;
type FormData = z.output<typeof Schema>;

// ── Steps ─────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Route", icon: MapPin, desc: "Pickup & drop locations" },
  { id: 2, label: "Cargo", icon: Package, desc: "Material & packaging details" },
  { id: 3, label: "Options", icon: Settings2, desc: "Special requirements" },
  { id: 4, label: "Bidding", icon: Clock, desc: "Price & bid window" },
];

export function LoadPostingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch, setValue,
    trigger, formState: { errors },
  } = useForm<FormInput,unknown,FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      isFragile: false,
      isTarpRequired: false,
      labourRequired: false,
    },
  });

  const isFragile = watch("isFragile");
  const isTarpRequired = watch("isTarpRequired");
  const labourRequired = watch("labourRequired");

  // Step validation fields
  const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
    1: ["pickupAddress", "dropAddress"],
    2: ["materialType", "packagingType", "weight"],
    3: [],
    4: ["biddingClosesAt"],
  };

  async function nextStep() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLoad({
        ...data,
        basePrice: data.basePrice ? Number(data.basePrice) : undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(`Load ${result.data.loadNumber} posted!`, {
        description: "Transporters can now bid on your load",
      });
      router.push(`/shipper/loads/${result.data.id}` as Route);
    });
  }

  // Get min datetime for bidding close (at least 1 hour from now)
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;

          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "size-9 rounded-full flex items-center justify-center",
                    "text-sm font-medium transition-all border-2",
                    isActive &&
                      "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]",
                    isDone &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    !isActive &&
                      !isDone &&
                      "border-[var(--border)] text-[var(--muted-foreground)]"
                  )}
                >
                  {isDone ? (
                    <CheckCircle className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium mt-1 hidden sm:block",
                    isActive
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted-foreground)]"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step > s.id
                      ? "bg-emerald-500"
                      : "bg-[var(--border)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5"
      >
        {/* ── Step 1: Route ── */}
        {step === 1 && (
          <>
            <div>
              <h3 className="text-sm font-semibold">Route Details</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Enter pickup and delivery locations
              </p>
            </div>
            <Separator />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  Pickup Address *
                </Label>
                <Textarea
                  placeholder="Full pickup address including city, state, PIN"
                  rows={2}
                  className={cn(
                    "resize-none",
                    errors.pickupAddress && "border-destructive"
                  )}
                  {...register("pickupAddress")}
                />
                {errors.pickupAddress && (
                  <p className="text-xs text-destructive">
                    {errors.pickupAddress.message}
                  </p>
                )}
              </div>

              {/* Visual connector */}
              <div className="flex items-center gap-3 py-1">
                <div className="w-0.5 h-6 bg-[var(--border)] ml-1" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  to
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-500" />
                  Drop Address *
                </Label>
                <Textarea
                  placeholder="Full delivery address including city, state, PIN"
                  rows={2}
                  className={cn(
                    "resize-none",
                    errors.dropAddress && "border-destructive"
                  )}
                  {...register("dropAddress")}
                />
                {errors.dropAddress && (
                  <p className="text-xs text-destructive">
                    {errors.dropAddress.message}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Cargo ── */}
        {step === 2 && (
          <>
            <div>
              <h3 className="text-sm font-semibold">Cargo Details</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Describe what needs to be transported
              </p>
            </div>
            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Material Type *</Label>
                <Select
                  onValueChange={(v) => setValue("materialType", v as any)}
                >
                  <SelectTrigger
                    className={cn(errors.materialType && "border-destructive")}
                  >
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.materialType && (
                  <p className="text-xs text-destructive">Required</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Packaging Type *</Label>
                <Select
                  onValueChange={(v) => setValue("packagingType", v as any)}
                >
                  <SelectTrigger
                    className={cn(errors.packagingType && "border-destructive")}
                  >
                    <SelectValue placeholder="Select packaging" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGING_TYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.packagingType && (
                  <p className="text-xs text-destructive">Required</p>
                )}
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-sm">Weight (Metric Tons) *</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.1"
                  placeholder="e.g. 18.5"
                  className={cn(errors.weight && "border-destructive")}
                  {...register("weight")}
                />
                {errors.weight && (
                  <p className="text-xs text-destructive">
                    {errors.weight.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Description{" "}
                <span className="text-[var(--muted-foreground)]">
                  (optional)
                </span>
              </Label>
              <Textarea
                placeholder="Additional details about the cargo..."
                rows={2}
                className="resize-none"
                {...register("description")}
              />
            </div>
          </>
        )}

        {/* ── Step 3: Special Options ── */}
        {step === 3 && (
          <>
            <div>
              <h3 className="text-sm font-semibold">Special Requirements</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Set any special handling instructions
              </p>
            </div>
            <Separator />

            <div className="space-y-4">
              {[
                {
                  field: "isFragile" as const,
                  value: isFragile,
                  label: "Fragile Cargo",
                  desc: "Requires extra careful handling",
                  emoji: "⚠️",
                },
                {
                  field: "isTarpRequired" as const,
                  value: isTarpRequired,
                  label: "Tarp Required",
                  desc: "Cargo must be covered with tarpaulin",
                  emoji: "🛡️",
                },
                {
                  field: "labourRequired" as const,
                  value: labourRequired,
                  label: "Labour Required",
                  desc: "Loading/unloading labour needed",
                  emoji: "👷",
                },
              ].map((opt) => (
                <div
                  key={opt.field}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    "transition-colors",
                    opt.value
                      ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                      : "border-[var(--border)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={opt.value}
                    onCheckedChange={(v) => setValue(opt.field, v)}
                  />
                </div>
              ))}

              <div className="space-y-1.5">
                <Label className="text-sm">Special Instructions</Label>
                <Textarea
                  placeholder="Any other special handling requirements..."
                  rows={3}
                  className="resize-none"
                  {...register("specialInstructions")}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Bidding ── */}
        {step === 4 && (
          <>
            <div>
              <h3 className="text-sm font-semibold">Bidding Configuration</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Set your expected price and bid window
              </p>
            </div>
            <Separator />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Base / Expected Price (₹){" "}
                  <span className="text-[var(--muted-foreground)]">
                    (optional)
                  </span>
                </Label>
                <Input
                  type="number"
                  step="500"
                  min="0"
                  placeholder="e.g. 45000"
                  {...register("basePrice")}
                />
                <p className="text-xs text-[var(--muted-foreground)]">
                  This is your reference price. Transporters may bid lower.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Bidding Closes At *</Label>
                <Input
                  type="datetime-local"
                  min={minDateTime}
                  className={cn(
                    errors.biddingClosesAt && "border-destructive"
                  )}
                  {...register("biddingClosesAt")}
                />
                {errors.biddingClosesAt && (
                  <p className="text-xs text-destructive">
                    {errors.biddingClosesAt.message}
                  </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  Minimum 1 hour from now. After this, no new bids accepted.
                </p>
              </div>

              {/* Summary card */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--metric-bg)] p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Load Summary
                </p>
                {[
                  { label: "From", value: watch("pickupAddress")?.split(",")[0] ?? "—" },
                  { label: "To", value: watch("dropAddress")?.split(",")[0] ?? "—" },
                  { label: "Material", value: watch("materialType") ?? "—" },
                  { label: "Weight", value: watch("weight") ? `${watch("weight")} MT` : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {row.label}
                    </span>
                    <span className="text-xs font-medium capitalize">
                      {row.value?.toString().toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={step === 1 || isPending}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            onClick={nextStep}
            className="gap-2"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="gap-2"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}
            {isPending ? "Posting load…" : "Post Load"}
          </Button>
        )}
      </div>
    </form>
  );
}