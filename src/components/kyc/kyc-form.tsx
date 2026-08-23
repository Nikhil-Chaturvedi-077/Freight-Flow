"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  updateTransporterProfile,
  updateUserKYC,
} from "@/actions/kyc.actions";
import { toast } from "sonner";

const Schema = z.object({
  companyName: z.string().min(2, "Required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Valid 10-digit number required"),
  gstNumber: z.string().optional(),
  vehicleNumber: z.string().min(5, "Enter valid vehicle number"),
  vehicleType: z.string().min(2, "Required"),
  capacity: z.coerce.number().positive("Must be positive"),
});

type FormData = z.infer<typeof Schema>;

const VEHICLE_TYPES = [
  "Open Body Truck",
  "Closed Body Truck",
  "Container Truck",
  "Trailer",
  "Mini Truck",
  "Pickup Van",
  "Tanker",
  "Refrigerated Truck",
];

interface KYCFormProps {
  initialData: Partial<FormData>;
}

export function KYCForm({ initialData }: KYCFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData,
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const [kycResult, profileResult] = await Promise.all([
        updateUserKYC({
          companyName: data.companyName,
          phone: data.phone,
          gstNumber: data.gstNumber,
        }),
        updateTransporterProfile({
          vehicleNumber: data.vehicleNumber,
          vehicleType: data.vehicleType,
          capacity: data.capacity,
        }),
      ]);

      if (!kycResult.success) {
        toast.error(kycResult.error);
        return;
      }
      if (!profileResult.success) {
        toast.error(profileResult.error);
        return;
      }

      toast.success("KYC information updated successfully");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Company Info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="text-sm font-semibold">Company Information</h3>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Company / Firm Name *</Label>
            <Input
              placeholder="Rajput Logistics Pvt Ltd"
              disabled={isPending}
              className={cn(errors.companyName && "border-destructive")}
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Mobile Number *</Label>
            <Input
              type="tel"
              placeholder="9876543210"
              disabled={isPending}
              className={cn(errors.phone && "border-destructive")}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm">
              GST Number{" "}
              <span className="text-[var(--muted-foreground)] font-normal">
                (optional)
              </span>
            </Label>
            <Input
              placeholder="22AAAAA0000A1Z5"
              className="uppercase"
              disabled={isPending}
              {...register("gstNumber")}
            />
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="text-sm font-semibold">Vehicle Details</h3>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Vehicle Registration Number *</Label>
            <Input
              placeholder="MH 12 AB 1234"
              className={cn(
                "uppercase",
                errors.vehicleNumber && "border-destructive"
              )}
              disabled={isPending}
              {...register("vehicleNumber")}
            />
            {errors.vehicleNumber && (
              <p className="text-xs text-destructive">
                {errors.vehicleNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Vehicle Type *</Label>
            <Select
              defaultValue={initialData.vehicleType}
              onValueChange={(v) => setValue("vehicleType", v ?? "")}
              disabled={isPending}
            >
              <SelectTrigger
                className={cn(errors.vehicleType && "border-destructive")}
              >
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((v) => (
                  <SelectItem key={v} value={v} className="text-sm">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleType && (
              <p className="text-xs text-destructive">
                {errors.vehicleType.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Load Capacity (MT) *</Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="e.g. 20"
              disabled={isPending}
              className={cn(errors.capacity && "border-destructive")}
              {...register("capacity")}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">
                {errors.capacity.message}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">
            📋 Documents required for full verification: RC Book, Driving
            License, Insurance Certificate. Document upload feature coming soon.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending || !isDirty}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {isPending ? "Saving…" : "Save & Submit for Review"}
      </Button>
    </form>
  );
}