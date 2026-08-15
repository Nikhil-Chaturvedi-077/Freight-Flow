// import type {
//   User,
//   Load,
//   Bid,
//   LoadStatus,
//   BidStatus,
//   MaterialType,
//   PackagingType,
//   Role,
// } from "@prisma/client";

// // ── Re-export Prisma types ──
// export type { LoadStatus, BidStatus, MaterialType, PackagingType, Role };

// // ── Extended types with relations ──
// export type LoadWithBids = Load & {
//   bids: (Bid & {
//     transporter: Pick<User, "id" | "name" | "companyName" | "image">;
//   })[];
//   shipper: Pick<User, "id" | "name" | "companyName">;
//   _count: { bids: number };
// };

// export type BidWithLoad = Bid & {
//   load: Pick
//     Load,
//     | "id"
//     | "loadNumber"
//     | "pickupAddress"
//     | "dropAddress"
//     | "materialType"
//     | "weight"
//     | "status"
//     | "biddingClosesAt"
//   >;
// };

// export type TransporterWithProfile = User & {
//   transporterProfile: {
//     vehicleNumber: string | null;
//     vehicleType: string | null;
//     capacity: number | null;
//     totalTrips: number;
//     rating: number;
//     ratingCount: number;
//     isAvailable: boolean;
//   } | null;
// };

// // ── Server Action return types ──
// export type ActionResult<T = void> =
//   | { success: true; data: T }
//   | { success: false; error: string };

// // ── Dashboard metric types ──
// export type ShipperMetrics = {
//   activeLoads: number;
//   liveBids: number;
//   escrowHeld: number;
//   deliveredMTD: number;
// };

// export type TransporterMetrics = {
//   activeBids: number;
//   wonLoads: number;
//   totalEarnings: number;
//   rating: number;
// };

import type {
  User,
  Load,
  Bid,
  LoadStatus,
  BidStatus,
  MaterialType,
  PackagingType,
  Role,
} from "@prisma/client";

// ── Re-export Prisma types ──
export type { LoadStatus, BidStatus, MaterialType, PackagingType, Role };

// ── Extended types with relations ──
export type LoadWithBids = Load & {
  bids: (Bid & {
    transporter: Pick<User, "id" | "name" | "companyName" | "image">;
  })[];
  shipper: Pick<User, "id" | "name" | "companyName">;
  _count: { bids: number };
};

export type BidWithLoad = Bid & {
  load: Pick<
    Load,
    | "id"
    | "loadNumber"
    | "pickupAddress"
    | "dropAddress"
    | "materialType"
    | "weight"
    | "status"
    | "biddingClosesAt"
  >;
};

export type TransporterWithProfile = User & {
  transporterProfile: {
    vehicleNumber: string | null;
    vehicleType: string | null;
    capacity: number | null;
    totalTrips: number;
    rating: number;
    ratingCount: number;
    isAvailable: boolean;
  } | null;
};

// ── Server Action return types ──
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Dashboard metric types ──
export type ShipperMetrics = {
  activeLoads: number;
  liveBids: number;
  escrowHeld: number;
  deliveredMTD: number;
};

export type TransporterMetrics = {
  activeBids: number;
  wonLoads: number;
  totalEarnings: number;
  rating: number;
};