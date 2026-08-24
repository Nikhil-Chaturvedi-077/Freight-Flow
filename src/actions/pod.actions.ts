"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { releaseEscrow } from "./wallet.actions";
import type { ActionResult } from "@/types";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Request OTP ────────────────────────────────────────────
export async function requestDeliveryOTP(
  loadId: string
): Promise<ActionResult<{ otp: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        status: true,
        acceptedBid: { select: { transporterId: true } },
      },
    });

    if (!load) return { success: false, error: "Load not found" };
    if (load.acceptedBid?.transporterId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (load.status !== "IN_TRANSIT" && load.status !== "ARRIVED") {
      return { success: false, error: "Load must be in transit or arrived" };
    }

    const otp = generateOTP();

    // Store OTP in document table (temporary)
    await prisma.document.upsert({
      where: {
        id: `otp-${loadId}`,
      },
      update: {
        name: otp,
        url: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      },
      create: {
        id: `otp-${loadId}`,
        loadId,
        name: otp,
        type: "OTP",
        url: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    // Update load status to ARRIVED
    await prisma.load.update({
      where: { id: loadId },
      data: { status: "ARRIVED" },
    });

    revalidatePath(`/transporter/loads/${loadId}`);

    // In production: Send OTP via SMS to shipper
    // For now return it (dev mode)
    return { success: true, data: { otp } };
  } catch (err) {
    console.error("[REQUEST_OTP]", err);
    return { success: false, error: "Failed to generate OTP" };
  }
}

// ── Confirm Delivery with OTP ─────────────────────────────
export async function confirmDelivery(
  loadId: string,
  otp: string,
  podPhotoUrl?: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        status: true,
        loadNumber: true,
        acceptedBid: { select: { transporterId: true } },
      },
    });

    if (!load) return { success: false, error: "Load not found" };
    if (load.acceptedBid?.transporterId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify OTP
    const otpDoc = await prisma.document.findUnique({
      where: { id: `otp-${loadId}` },
    });

    if (!otpDoc) {
      return { success: false, error: "OTP not found. Request a new one." };
    }

    // Check expiry
    if (new Date(otpDoc.url) < new Date()) {
      return { success: false, error: "OTP expired. Request a new one." };
    }

    // Verify OTP
    if (otpDoc.name !== otp.trim()) {
      return { success: false, error: "Invalid OTP. Please try again." };
    }

    // Save PoD photo if provided
    if (podPhotoUrl) {
      await prisma.document.create({
        data: {
          loadId,
          name: `PoD - ${load.loadNumber}`,
          type: "POD",
          url: podPhotoUrl,
        },
      });
    }

    // Delete OTP doc
    await prisma.document.delete({
      where: { id: `otp-${loadId}` },
    });

    // Release escrow — this also marks as DELIVERED
    const releaseResult = await releaseEscrow(loadId);
    if (!releaseResult.success) {
      return releaseResult;
    }

    revalidatePath(`/transporter/loads/${loadId}`);
    revalidatePath(`/transporter/won`);

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[CONFIRM_DELIVERY]", err);
    return { success: false, error: "Failed to confirm delivery" };
  }
}