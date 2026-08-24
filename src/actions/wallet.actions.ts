"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types";

// ── Hold Escrow (when bid accepted) ──────────────────────
export async function holdEscrow(
  loadId: string,
  amount: number
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Check if escrow already exists
    const existing = await prisma.escrowTransaction.findUnique({
      where: { loadId },
    });
    if (existing) return { success: true, data: undefined };

    await prisma.escrowTransaction.create({
      data: {
        loadId,
        amount,
        type: "ESCROW_HOLD",
        isReleased: false,
      },
    });

    revalidatePath("/shipper/wallet");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[HOLD_ESCROW]", err);
    return { success: false, error: "Failed to hold escrow" };
  }
}

// ── Release Escrow (on delivery) ──────────────────────────
export async function releaseEscrow(
  loadId: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Get load with accepted bid + escrow
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        acceptedBid: {
          select: { transporterId: true, amount: true },
        },
        escrowTransaction: true,
      },
    });

    if (!load) return { success: false, error: "Load not found" };
    if (!load.escrowTransaction) {
      return { success: false, error: "No escrow found for this load" };
    }
    if (load.escrowTransaction.isReleased) {
      return { success: false, error: "Escrow already released" };
    }
    if (!load.acceptedBid) {
      return { success: false, error: "No accepted bid found" };
    }

    const transporterId = load.acceptedBid.transporterId;
    const amount = load.escrowTransaction.amount;

    // Platform fee (2.5%)
    const platformFee = amount * 0.025;
    const transporterAmount = amount - platformFee;

    // Mark escrow as released
    await prisma.escrowTransaction.update({
      where: { loadId },
      data: {
        isReleased: true,
        releasedAt: new Date(),
        type: "ESCROW_RELEASE",
      },
    });

    // Add to transporter wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: transporterId },
    });

    if (wallet) {
      await prisma.wallet.update({
        where: { userId: transporterId },
        data: {
          balance: { increment: transporterAmount },
          totalEarned: { increment: transporterAmount },
        },
      });
    } else {
      await prisma.wallet.create({
        data: {
          userId: transporterId,
          balance: transporterAmount,
          totalEarned: transporterAmount,
        },
      });
    }

    // Update load status to DELIVERED
    await prisma.load.update({
      where: { id: loadId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    revalidatePath(`/shipper/loads/${loadId}`);
    revalidatePath("/shipper/wallet");
    revalidatePath("/transporter/wallet");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[RELEASE_ESCROW]", err);
    return { success: false, error: "Failed to release escrow" };
  }
}

// ── Get Shipper Wallet Data ───────────────────────────────
export async function getShipperWalletData(shipperId: string) {
  const [escrowHeld, totalSpent, recentEscrows] = await Promise.all([
    prisma.escrowTransaction.aggregate({
      where: { load: { shipperId }, isReleased: false },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.escrowTransaction.aggregate({
      where: { load: { shipperId }, isReleased: true },
      _sum: { amount: true },
    }),
    prisma.escrowTransaction.findMany({
      where: { load: { shipperId } },
      orderBy: { heldAt: "desc" },
      take: 10,
      include: {
        load: {
          select: {
            loadNumber: true,
            pickupAddress: true,
            dropAddress: true,
            status: true,
            acceptedBid: {
              include: {
                transporter: {
                  select: { name: true, companyName: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    escrowHeld: escrowHeld._sum.amount ?? 0,
    activeEscrows: escrowHeld._count,
    totalSpent: totalSpent._sum.amount ?? 0,
    recentEscrows,
  };
}

// ── Get Transporter Wallet Data ───────────────────────────
export async function getTransporterWalletData(transporterId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: transporterId },
  });

  const recentEscrows = await prisma.escrowTransaction.findMany({
    where: {
      load: { acceptedBid: { transporterId } },
      isReleased: true,
    },
    orderBy: { releasedAt: "desc" },
    take: 10,
    include: {
      load: {
        select: {
          loadNumber: true,
          pickupAddress: true,
          dropAddress: true,
          deliveredAt: true,
        },
      },
    },
  });

  return {
    balance: wallet?.balance ?? 0,
    totalEarned: wallet?.totalEarned ?? 0,
    recentEscrows,
  };
}