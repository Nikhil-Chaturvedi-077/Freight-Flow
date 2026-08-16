"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateLoadNumber } from "@/lib/utils";
import type { ActionResult } from "@/types";
import type { LoadStatus } from "@prisma/client";

// ── Schemas ───────────────────────────────────────────────
const CreateLoadSchema = z.object({
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
  weight: z.number().positive("Weight must be positive"),
  description: z.string().optional(),
  specialInstructions: z.string().optional(),
  isFragile: z.boolean().default(false),
  isTarpRequired: z.boolean().default(false),
  labourRequired: z.boolean().default(false),
  basePrice: z.number().positive().optional(),
  biddingClosesAt: z.string().min(1, "Bidding close time required"),
});

export type CreateLoadInput = z.infer<typeof CreateLoadSchema>;

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
    // Never block main action on socket failure
    console.warn(`[SOCKET] ${endpoint} emit failed (non-critical):`, err);
  }
}

// ── Create Load ───────────────────────────────────────────
export async function createLoad(
  input: CreateLoadInput
): Promise<ActionResult<{ id: string; loadNumber: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "SHIPPER") {
      return { success: false, error: "Only shippers can post loads" };
    }

    const parsed = CreateLoadSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const data = parsed.data;

    // Validate bidding close time
    const closesAt = new Date(data.biddingClosesAt);
    if (closesAt <= new Date()) {
      return {
        success: false,
        error: "Bidding close time must be in the future",
      };
    }

    const loadNumber = generateLoadNumber();

    // Direct create — no transaction (NeonDB serverless fix for P2028)
    const load = await prisma.load.create({
      data: {
        loadNumber,
        shipperId: session.user.id,
        status: "OPEN",
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat ?? null,
        pickupLng: data.pickupLng ?? null,
        dropAddress: data.dropAddress,
        dropLat: data.dropLat ?? null,
        dropLng: data.dropLng ?? null,
        materialType: data.materialType,
        packagingType: data.packagingType,
        weight: data.weight,
        description: data.description ?? null,
        specialInstructions: data.specialInstructions ?? null,
        isFragile: data.isFragile,
        isTarpRequired: data.isTarpRequired,
        labourRequired: data.labourRequired,
        basePrice: data.basePrice ?? null,
        biddingClosesAt: closesAt,
      },
    });

    // Emit to socket server (non-blocking)
    await socketEmit("/emit/new-load", {
      data: {
        loadId: load.id,
        loadNumber: load.loadNumber,
        pickupAddress: load.pickupAddress,
        dropAddress: load.dropAddress,
        materialType: load.materialType,
        weight: load.weight,
        biddingClosesAt: load.biddingClosesAt.toISOString(),
        basePrice: load.basePrice,
      },
    });

    revalidatePath("/shipper/loads");
    revalidatePath("/shipper");

    return {
      success: true,
      data: { id: load.id, loadNumber: load.loadNumber },
    };
  } catch (err) {
    console.error("[CREATE_LOAD]", err);
    return {
      success: false,
      error: "Failed to create load. Please try again.",
    };
  }
}

// ── Update Load Status ─────────────────────────────────────
export async function updateLoadStatus(
  loadId: string,
  newStatus: LoadStatus
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch load first
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        loadNumber: true,
        status: true,
        shipperId: true,
      },
    });

    if (!load) {
      return { success: false, error: "Load not found" };
    }

    if (
      load.shipperId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return { success: false, error: "Unauthorized" };
    }

    // Update load status
    const updatedLoad = await prisma.load.update({
      where: { id: loadId },
      data: {
        status: newStatus,
        inTransitAt:
          newStatus === "IN_TRANSIT" ? new Date() : undefined,
        deliveredAt:
          newStatus === "DELIVERED" ? new Date() : undefined,
      },
    });

    // Emit to socket server (non-blocking)
    await socketEmit("/emit/load-status", {
      loadId,
      userId: load.shipperId,
      data: {
        loadId,
        loadNumber: load.loadNumber,
        oldStatus: load.status,
        newStatus,
        updatedAt: updatedLoad.updatedAt.toISOString(),
      },
    });

    revalidatePath(`/shipper/loads/${loadId}`);
    revalidatePath("/shipper");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UPDATE_LOAD_STATUS]", err);
    return { success: false, error: "Failed to update status" };
  }
}

// ── Get Shipper Loads ──────────────────────────────────────
export async function getShipperLoads(shipperId: string) {
  return prisma.load.findMany({
    where: { shipperId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bids: true } },
      bids: {
        where: { status: "ACTIVE" },
        orderBy: { amount: "asc" },
        take: 1,
        select: { amount: true },
      },
    },
  });
}

// ── Get Open Loads for Transporters ───────────────────────
export async function getOpenLoads(filters?: {
  materialType?: string;
  minWeight?: number;
  maxWeight?: number;
}) {
  return prisma.load.findMany({
    where: {
      status: "OPEN",
      biddingClosesAt: { gt: new Date() },
      ...(filters?.materialType
        ? { materialType: filters.materialType as any }
        : {}),
      ...(filters?.minWeight
        ? { weight: { gte: filters.minWeight } }
        : {}),
      ...(filters?.maxWeight
        ? { weight: { lte: filters.maxWeight } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      shipper: {
        select: { id: true, name: true, companyName: true },
      },
      _count: { select: { bids: true } },
      bids: {
        where: { status: "ACTIVE" },
        orderBy: { amount: "asc" },
        take: 1,
        select: { amount: true },
      },
    },
  });
}

// ── Get Single Load ────────────────────────────────────────
export async function getLoadById(loadId: string) {
  return prisma.load.findUnique({
    where: { id: loadId },
    include: {
      shipper: {
        select: { id: true, name: true, companyName: true },
      },
      acceptedBid: {
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
                  vehicleNumber: true,
                  vehicleType: true,
                },
              },
            },
          },
        },
      },
    },
  });
}