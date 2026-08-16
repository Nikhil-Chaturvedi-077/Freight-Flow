"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateLoadNumber } from "@/lib/utils";
import { emitNewLoad, emitLoadStatusChanged } from "@/lib/socket-emit";
import type { ActionResult } from "@/types";
import type { LoadStatus } from "@prisma/client";

const CreateLoadSchema = z.object({
  // Route
  pickupAddress: z.string().min(5, "Pickup address required"),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropAddress: z.string().min(5, "Drop address required"),
  dropLat: z.number().optional(),
  dropLng: z.number().optional(),

  // Cargo
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

  // Bid window
  basePrice: z.number().positive().optional(),
  biddingClosesAt: z.string().min(1, "Bidding close time required"),
});

export type CreateLoadInput = z.infer<typeof CreateLoadSchema>;

export async function createLoad(
  input: CreateLoadInput
): Promise<ActionResult<{ id: string; loadNumber: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (session.user.role !== "SHIPPER") return { success: false, error: "Only shippers can post loads" };

    const parsed = CreateLoadSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const data = parsed.data;

    // Validate bidding close time
    const closesAt = new Date(data.biddingClosesAt);
    if (closesAt <= new Date()) {
      return { success: false, error: "Bidding close time must be in the future" };
    }

    // Generate unique load number
    const loadNumber = generateLoadNumber();

    const load = await prisma.$transaction(async (tx) => {
      const l = await tx.load.create({
        data: {
          loadNumber,
          shipperId: session.user.id,
          status: "OPEN",
          pickupAddress: data.pickupAddress,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          dropAddress: data.dropAddress,
          dropLat: data.dropLat,
          dropLng: data.dropLng,
          materialType: data.materialType,
          packagingType: data.packagingType,
          weight: data.weight,
          description: data.description,
          specialInstructions: data.specialInstructions,
          isFragile: data.isFragile,
          isTarpRequired: data.isTarpRequired,
          labourRequired: data.labourRequired,
          basePrice: data.basePrice,
          biddingClosesAt: closesAt,
        },
      });

      return l;
    });

    // Emit to socket server (non-blocking)
    await emitNewLoad({
      loadId: load.id,
      loadNumber: load.loadNumber,
      pickupAddress: load.pickupAddress,
      dropAddress: load.dropAddress,
      materialType: load.materialType,
      weight: load.weight,
      biddingClosesAt: load.biddingClosesAt.toISOString(),
      basePrice: load.basePrice,
    });

    revalidatePath("/shipper/loads");
    return { success: true, data: { id: load.id, loadNumber: load.loadNumber } };
  } catch (err) {
    console.error("[CREATE_LOAD]", err);
    return { success: false, error: "Failed to create load. Try again." };
  }
}

// ── Update Load Status ────────────────────────────────────
export async function updateLoadStatus(
  loadId: string,
  newStatus: LoadStatus
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

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
    if (load.shipperId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const updatedLoad = await prisma.load.update({
      where: { id: loadId },
      data: {
        status: newStatus,
        inTransitAt: newStatus === "IN_TRANSIT" ? new Date() : undefined,
        deliveredAt: newStatus === "DELIVERED" ? new Date() : undefined,
      },
    });

    // Emit status change
    await emitLoadStatusChanged(loadId, load.shipperId, {
      loadId,
      loadNumber: load.loadNumber,
      oldStatus: load.status,
      newStatus,
      updatedAt: updatedLoad.updatedAt.toISOString(),
    });

    revalidatePath(`/shipper/loads/${loadId}`);
    revalidatePath("/shipper");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[UPDATE_LOAD_STATUS]", err);
    return { success: false, error: "Failed to update status" };
  }
}

// ── Get Loads for Shipper ─────────────────────────────────
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

// ── Get Open Loads for Transporters ──────────────────────
export async function getOpenLoads(filters?: {
  materialType?: string;
  minWeight?: number;
  maxWeight?: number;
}) {
  return prisma.load.findMany({
    where: {
      status: "OPEN",
      biddingClosesAt: { gt: new Date() },
      ...(filters?.materialType ? { materialType: filters.materialType as any } : {}),
      ...(filters?.minWeight ? { weight: { gte: filters.minWeight } } : {}),
      ...(filters?.maxWeight ? { weight: { lte: filters.maxWeight } } : {}),
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