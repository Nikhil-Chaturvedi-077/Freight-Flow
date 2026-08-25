"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateTransporterProfile, updateUserKYC } from "@/actions/kyc.actions";
import { cn } from "@/lib/utils";

const VEHICLE_TYPES = [
  "Open Body Truck", "Closed Body Truck", "Container Truck",
  "Trailer", "Mini Truck", "Pickup Van", "Tanker", "Refrigerated Truck",
];

const Schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit number"),
  companyName: z.string().min(2, "Required"),
  gstNumber: z.string().optional(),
  vehicleNumber: z.string().min(5, "Valid vehicle number required"),
  vehicleType: z.string().min(1, "Select vehicle type"),
  capacity: z.coerce.number().positive("Must be positive"),
});

type FormData = z.infer<typeof Schema>;

interface TransporterSettingsFormProps {
  initialUser: {
    name: string | null;
    email: string;
    phone: string | null;
    companyName: string | null;
    gstNumber: string | null;
  };
  initialProfile: {
    vehicleNumber: string | null;
    vehicleType: string | null;
    capacity: number | null;
    isAvailable: boolean;
  } | null;
}

export function TransporterSettingsForm({
  initialUser,
  initialProfile,
}: TransporterSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: initialUser.name ?? "",
      phone: initialUser.phone ?? "",
      companyName: initialUser.companyName ?? "",
      gstNumber: initialUser.gstNumber ?? "",
      vehicleNumber: initialProfile?.vehicleNumber ?? "",
      vehicleType: initialProfile?.vehicleType ?? "",
      capacity: initialProfile?.capacity ?? undefined,
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const [userRes, profileRes] = await Promise.all([
        updateUserKYC({
          phone: data.phone,
          companyName: data.companyName,
          gstNumber: data.gstNumber,
        }),
        updateTransporterProfile({
          vehicleNumber: data.vehicleNumber,
          vehicleType: data.vehicleType,
          capacity: data.capacity,
        }),
      ]);

      if (!userRes.success) { toast.error(userRes.error); return; }
      if (!profileRes.success) { toast.error(profileRes.error); return; }

      toast.success("Settings saved successfully");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Account Info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="text-sm font-semibold">Account Information</h3>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Full Name</Label>
            <Input
              disabled={isPending}
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Email</Label>
            <Input
              value={initialUser.email}
              disabled
              className="bg-[var(--muted)] cursor-not-allowed opacity-60"
            />
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
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Company / Firm Name *</Label>
            <Input
              placeholder="Rajput Logistics"
              disabled={isPending}
              className={cn(errors.companyName && "border-destructive")}
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-1.5 col-span-2">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Vehicle Registration No. *</Label>
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
              defaultValue={initialProfile?.vehicleType ?? ""}
              onValueChange={(v) => setValue("vehicleType", v ?? "")}
              disabled={isPending}
            >
              <SelectTrigger className={cn(errors.vehicleType && "border-destructive")}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((v) => (
                  <SelectItem key={v} value={v} className="text-sm">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
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
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}