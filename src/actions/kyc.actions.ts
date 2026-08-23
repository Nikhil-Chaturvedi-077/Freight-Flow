"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types";

const UpdateProfileSchema = z.object({
  vehicleNumber: z.string().min(5, "Enter valid vehicle number"),
  vehicleType: z.string().min(2, "Vehicle type required"),
  capacity: z.coerce.number().positive("Capacity must be positive"),
});

const UpdateKYCSchema = z.object({
  gstNumber: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit number required"),
  companyName: z.string().min(2, "Company name required"),
});

export async function updateTransporterProfile(
  input: z.infer<typeof UpdateProfileSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const parsed = UpdateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    await prisma.transporterProfile.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: {
        userId: session.user.id,
        ...parsed.data,
      },
    });

    revalidatePath("/transporter/kyc");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UPDATE_PROFILE]", err);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateUserKYC(
  input: z.infer<typeof UpdateKYCSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const parsed = UpdateKYCSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: parsed.data.phone,
        companyName: parsed.data.companyName,
        gstNumber: parsed.data.gstNumber ?? null,
        kycStatus: "PENDING",
      },
    });

    revalidatePath("/transporter/kyc");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UPDATE_KYC]", err);
    return { success: false, error: "Failed to update KYC info" };
  }
}

// Admin: approve/reject KYC
export async function updateKYCStatus(
  userId: string,
  status: "VERIFIED" | "REJECTED"
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: status },
    });

    revalidatePath("/admin/kyc");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UPDATE_KYC_STATUS]", err);
    return { success: false, error: "Failed to update KYC status" };
  }
}