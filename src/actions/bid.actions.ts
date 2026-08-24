"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BID_RATE_LIMIT_SECONDS } from "@/lib/constants";
import type { ActionResult } from "@/types";

// ── Schemas ───────────────────────────────────────────────
const PlaceBidSchema = z.object({
  loadId: z.string().min(1, "Load ID required"),
  amount: z.number().positive("Bid amount must be positive"),
  note: z.string().optional(),
});

const AcceptBidSchema = z.object({
  loadId: z.string().min(1),
  bidId: z.string().min(1),
});

// ── Socket emit helper ────────────────────────────────────
async function socketEmit(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const secret = process.env.SOCKET_EMIT_SECRET;
    if (!socketUrl || !secret) return;

    await fetch(`${socketUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.warn(`[SOCKET] ${endpoint} failed (non-critical):`, err);
  }
}

// ── Place / Update Bid ─────────────────────────────────────
export async function placeBid(
  input: z.infer<typeof PlaceBidSchema>
): Promise<ActionResult<{ bidId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "TRANSPORTER") {
      return { success: false, error: "Only transporters can bid" };
    }

    const parsed = PlaceBidSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { loadId, amount, note } = parsed.data;

    // ── Step 1: Validate load ─────────────────────────────
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        status: true,
        biddingClosesAt: true,
        loadNumber: true,
        shipperId: true,
      },
    });

    if (!load) {
      return { success: false, error: "Load not found" };
    }
    if (load.status !== "OPEN") {
      return {
        success: false,
        error: "This load is no longer accepting bids",
      };
    }
    if (new Date(load.biddingClosesAt) <= new Date()) {
      return { success: false, error: "Bidding window has closed" };
    }

    // ── Step 2: Rate limit check ──────────────────────────
    const existingBid = await prisma.bid.findUnique({
      where: {
        loadId_transporterId: {
          loadId,
          transporterId: session.user.id,
        },
      },
      select: {
        id: true,
        amount: true,
        lastModifiedAt: true,
      },
    });

    if (existingBid) {
      const secondsSince =
        (Date.now() - new Date(existingBid.lastModifiedAt).getTime()) /
        1000;

      if (secondsSince < BID_RATE_LIMIT_SECONDS) {
        const waitSeconds = Math.ceil(
          BID_RATE_LIMIT_SECONDS - secondsSince
        );
        return {
          success: false,
          error: `Please wait ${waitSeconds}s before modifying your bid`,
        };
      }
    }

    // ── Step 3: Upsert this transporter's bid ─────────────
    const bid = await prisma.bid.upsert({
      where: {
        loadId_transporterId: {
          loadId,
          transporterId: session.user.id,
        },
      },
      update: {
        amount,
        note: note ?? null,
        status: "ACTIVE",
        lastModifiedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        loadId,
        transporterId: session.user.id,
        amount,
        note: note ?? null,
        status: "ACTIVE",
        lastModifiedAt: new Date(),
      },
      include: {
        transporter: {
          select: { name: true, companyName: true },
        },
      },
    });

    // ── Step 4: Get all bids sorted by amount ─────────────
    const allBids = await prisma.bid.findMany({
      where: {
        loadId,
        status: { in: ["ACTIVE", "OUTBID"] },
      },
      orderBy: { amount: "asc" },
      include: {
        transporter: {
          select: {
            id: true,
            name: true,
            companyName: true,
            transporterProfile: {
              select: { rating: true, totalTrips: true },
            },
          },
        },
      },
    });

    // ── Step 5: Update bid statuses ───────────────────────
    // Lowest bid → ACTIVE, rest → OUTBID
    // Using Promise.all — no transaction needed
    await Promise.all(
      allBids.map((b, index) =>
        prisma.bid.update({
          where: { id: b.id },
          data: { status: index === 0 ? "ACTIVE" : "OUTBID" },
        })
      )
    );

    // ── Step 6: Build leaderboard ─────────────────────────
    const leaderboard = allBids.map((b, index) => ({
      rank: index + 1,
      bidId: b.id,
      transporterId: b.transporterId,
      transporterName: b.transporter.name ?? "Unknown",
      companyName: b.transporter.companyName,
      rating: b.transporter.transporterProfile?.rating ?? 0,
      totalTrips: b.transporter.transporterProfile?.totalTrips ?? 0,
      amount: b.amount,
      status: index === 0 ? ("LEADING" as const) : ("OUTBID" as const),
      submittedAt: b.submittedAt.toISOString(),
    }));

    // ── Step 7: Socket emits (non-blocking) ───────────────
    await socketEmit("/emit/bid-placed", {
      loadId,
      data: {
        loadId,
        loadNumber: load.loadNumber,
        bid: {
          id: bid.id,
          transporterId: session.user.id,
          transporterName: bid.transporter.name ?? "Unknown",
          companyName: bid.transporter.companyName,
          amount,
          submittedAt: bid.submittedAt.toISOString(),
        },
        leaderboard,
        totalBids: allBids.length,
        lowestBid: allBids[0]?.amount ?? amount,
      },
    });

    // Notify shipper
    await socketEmit("/emit/notification", {
      userId: load.shipperId,
      data: {
        id: `notif-${Date.now()}`,
        userId: load.shipperId,
        title: "New bid received",
        body: `${
          bid.transporter.companyName ?? bid.transporter.name
        } bid ₹${amount.toLocaleString("en-IN")} on ${load.loadNumber}`,
        type: "bid",
        createdAt: new Date().toISOString(),
      },
    });

    revalidatePath(`/transporter/loads/${loadId}`);
    revalidatePath(`/shipper/loads/${loadId}`);

    return { success: true, data: { bidId: bid.id } };
  } catch (err) {
    console.error("[PLACE_BID]", err);
    const message =
      err instanceof Error ? err.message : "Failed to place bid";
    return { success: false, error: message };
  }
}

// ── Accept Bid ─────────────────────────────────────────────
export async function acceptBid(
  loadId: string,
  bidId: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = AcceptBidSchema.safeParse({ loadId, bidId });
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    // ── Step 1: Validate load ─────────────────────────────
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        loadNumber: true,
        status: true,
        shipperId: true,
      },
    });

    if (!load) return { success: false, error: "Load not found" };
    if (load.shipperId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (load.status !== "OPEN") {
      return { success: false, error: "Load is no longer open" };
    }

    // ── Step 2: Validate bid ──────────────────────────────
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: {
        id: true,
        transporterId: true,
        amount: true,
        loadId: true,
      },
    });

    if (!bid) return { success: false, error: "Bid not found" };
    if (bid.loadId !== loadId) {
      return { success: false, error: "Bid does not belong to this load" };
    }

    // ── Step 3: Update load status ────────────────────────
    await prisma.load.update({
      where: { id: loadId },
      data: {
        status: "BIDDING_CLOSED",
        acceptedBidId: bidId,
      },
    });

    // ── Step 4: Mark accepted bid ─────────────────────────
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "ACCEPTED" },
    });

    // ── Step 5: Reject all other bids ─────────────────────
    await prisma.bid.updateMany({
      where: {
        loadId,
        id: { not: bidId },
        status: { in: ["ACTIVE", "OUTBID"] },
      },
      data: { status: "REJECTED" },
    });

    // ── Step 6: Hold escrow automatically ──────────────
    const existingEscrow = await prisma.escrowTransaction.findUnique({
      where: { loadId },
    });

    if (!existingEscrow) {
      await prisma.escrowTransaction.create({
        data: {
          loadId,
          amount: bid.amount,
          type: "ESCROW_HOLD",
          isReleased: false,
        },
      });
    }

    // ── Step 7: Socket emits (non-blocking) ───────────────
    await socketEmit("/emit/bid-accepted", {
      loadId,
      transporterId: bid.transporterId,
      data: {
        loadId,
        bidId,
        transporterId: bid.transporterId,
        loadNumber: load.loadNumber,
      },
    });

    // Notify all other rejected bidders
    const rejectedBids = await prisma.bid.findMany({
      where: { loadId, id: { not: bidId }, status: "REJECTED" },
      select: { transporterId: true },
    });

    await Promise.all(
      rejectedBids.map((rb) =>
        socketEmit("/emit/notification", {
          userId: rb.transporterId,
          data: {
            id: `notif-${Date.now()}-${rb.transporterId}`,
            userId: rb.transporterId,
            title: "Bid not selected",
            body: `Another transporter was selected for ${load.loadNumber}`,
            type: "bid",
            createdAt: new Date().toISOString(),
          },
        })
      )
    );

    revalidatePath(`/shipper/loads/${loadId}`);
    revalidatePath("/shipper/bids");
    revalidatePath("/shipper/wallet");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[ACCEPT_BID]", err);
    const message =
      err instanceof Error ? err.message : "Failed to accept bid";
    return { success: false, error: message };
  }
}

// ── Get Load Leaderboard ───────────────────────────────────
export async function getLoadLeaderboard(loadId: string) {
  const bids = await prisma.bid.findMany({
    where: {
      loadId,
      status: { in: ["ACTIVE", "OUTBID", "ACCEPTED"] },
    },
    orderBy: { amount: "asc" },
    include: {
      transporter: {
        select: {
          id: true,
          name: true,
          companyName: true,
          transporterProfile: {
            select: {
              rating: true,
              totalTrips: true,
            },
          },
        },
      },
    },
  });

  return bids.map((b, index) => ({
    rank: index + 1,
    bidId: b.id,
    transporterId: b.transporterId,
    transporterName: b.transporter.name ?? "Unknown",
    companyName: b.transporter.companyName,
    rating: b.transporter.transporterProfile?.rating ?? 0,
    totalTrips: b.transporter.transporterProfile?.totalTrips ?? 0,
    amount: b.amount,
    status: b.status,
    note: b.note,
    submittedAt: b.submittedAt.toISOString(),
  }));
}

// ── Get Transporter's Active Bids ─────────────────────────
export async function getTransporterBids(transporterId: string) {
  return prisma.bid.findMany({
    where: {
      transporterId,
      status: { in: ["ACTIVE", "OUTBID"] },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      load: {
        select: {
          id: true,
          loadNumber: true,
          pickupAddress: true,
          dropAddress: true,
          materialType: true,
          weight: true,
          status: true,
          biddingClosesAt: true,
          bids: {
            where: { status: "ACTIVE" },
            orderBy: { amount: "asc" },
            take: 1,
            select: { amount: true },
          },
        },
      },
    },
  });
}

// ── Withdraw Bid ───────────────────────────────────────────
export async function withdrawBid(
  bidId: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: {
        id: true,
        transporterId: true,
        loadId: true,
        status: true,
        load: {
          select: { status: true },
        },
      },
    });

    if (!bid) {
      return { success: false, error: "Bid not found" };
    }
    if (bid.transporterId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (bid.load.status !== "OPEN") {
      return { success: false, error: "Cannot withdraw after bidding is closed" };
    }

    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "WITHDRAWN" },
    });

    // Recalculate leaderboard after withdrawal
    const remainingBids = await prisma.bid.findMany({
      where: {
        loadId: bid.loadId,
        status: { in: ["ACTIVE", "OUTBID"] },
      },
      orderBy: { amount: "asc" },
    });

    if (remainingBids.length > 0) {
      await Promise.all(
        remainingBids.map((b, index) =>
          prisma.bid.update({
            where: { id: b.id },
            data: { status: index === 0 ? "ACTIVE" : "OUTBID" },
          })
        )
      );
    }

    revalidatePath(`/transporter/bids`);
    revalidatePath(`/transporter/loads/${bid.loadId}`);

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[WITHDRAW_BID]", err);
    return { success: false, error: "Failed to withdraw bid" };
  }
}