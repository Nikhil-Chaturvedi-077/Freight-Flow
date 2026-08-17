"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types";

export async function setUserRole(
  role: "SHIPPER" | "TRANSPORTER"
): Promise<ActionResult<{ role: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Update role in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    // Create wallet if not exists
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });
    if (!wallet) {
      await prisma.wallet.create({
        data: { userId: session.user.id },
      });
    }

    // Create transporter profile if needed
    if (role === "TRANSPORTER") {
      const profile = await prisma.transporterProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!profile) {
        await prisma.transporterProfile.create({
          data: { userId: session.user.id },
        });
      }
    }

    return { success: true, data: { role } };
  } catch (err) {
    console.error("[SET_ROLE]", err);
    return { success: false, error: "Failed to set role" };
  }
}