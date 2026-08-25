"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const Schema = z.object({
  name: z.string().min(2, "At least 2 characters"),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Valid 10-digit number")
    .optional()
    .or(z.literal("")),

  companyName: z
    .string()
    .min(2, "Required")
    .optional(),

  gstNumber: z
    .string()
    .optional(),
});

type FormData = z.infer<typeof Schema>;

interface ProfileSettingsFormProps {
  initialData: {
    name: string | null;
    email: string;
    phone: string | null;
    companyName: string | null;
    gstNumber: string | null;
  };
}

export function ProfileSettingsForm({
  initialData,
}: ProfileSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),

    defaultValues: {
      name: initialData.name ?? "",
      phone: initialData.phone ?? "",
      companyName: initialData.companyName ?? "",
      gstNumber: initialData.gstNumber ?? "",
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(data),
        });

        const result = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(
            result?.error ||
              result?.message ||
              "Failed to update profile"
          );
          return;
        }

        toast.success("Profile updated successfully");
      } catch (error) {
        console.error("[PROFILE_UPDATE]", error);

        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">
          Profile Information
        </h3>

        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          Update your account details
        </p>
      </div>

      <Separator />

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Full Name
            </Label>

            <Input
              disabled={isPending}
              {...register("name")}
              className={
                errors.name
                  ? "border-destructive"
                  : ""
              }
            />

            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Email
            </Label>

            <Input
              value={initialData.email}
              disabled
              className="bg-[var(--muted)] cursor-not-allowed"
            />

            <p className="text-[10px] text-[var(--muted-foreground)]">
              Email cannot be changed
            </p>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Mobile Number
            </Label>

            <Input
              type="tel"
              placeholder="9876543210"
              disabled={isPending}
              {...register("phone")}
              className={
                errors.phone
                  ? "border-destructive"
                  : ""
              }
            />

            {errors.phone && (
              <p className="text-xs text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Company Name
            </Label>

            <Input
              placeholder="Acme Logistics"
              disabled={isPending}
              {...register("companyName")}
              className={
                errors.companyName
                  ? "border-destructive"
                  : ""
              }
            />

            {errors.companyName && (
              <p className="text-xs text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          {/* GST */}
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

            {errors.gstNumber && (
              <p className="text-xs text-destructive">
                {errors.gstNumber.message}
              </p>
            )}
          </div>
        </div>

        {/* Save */}
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

          {isPending
            ? "Saving…"
            : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}