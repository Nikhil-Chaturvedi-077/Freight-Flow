"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types";

const RatingSchema = z.object({
  loadId: z.string(),
  transporterId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function rateTransporter(
  input: z.infer<typeof RatingSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (session.user.role !== "SHIPPER") {
      return { success: false, error: "Only shippers can rate transporters" };
    }

    const parsed = RatingSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { loadId, transporterId, rating, comment } = parsed.data;

    // Verify the shipper owns this load
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        shipperId: session.user.id,
        status: "DELIVERED",
        acceptedBid: { transporterId },
      },
    });

    if (!load) {
      return {
        success: false,
        error: "Load not found or not eligible for rating",
      };
    }

    // Get current profile
    const profile = await prisma.transporterProfile.findUnique({
      where: { userId: transporterId },
      select: { rating: true, ratingCount: true },
    });

    if (!profile) {
      return { success: false, error: "Transporter profile not found" };
    }

    // Calculate new average rating
    const currentTotal = profile.rating * profile.ratingCount;
    const newCount = profile.ratingCount + 1;
    const newRating = (currentTotal + rating) / newCount;

    await prisma.transporterProfile.update({
      where: { userId: transporterId },
      data: {
        rating: Math.round(newRating * 10) / 10, // 1 decimal
        ratingCount: newCount,
        totalTrips: { increment: 1 },
      },
    });

    revalidatePath(`/shipper/loads/${loadId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[RATE_TRANSPORTER]", err);
    return { success: false, error: "Failed to submit rating" };
  }
}