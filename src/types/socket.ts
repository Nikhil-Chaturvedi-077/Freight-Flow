// Mirror of server types — keep in sync

export interface LeaderboardEntry {
  rank: number;
  bidId: string;
  transporterId: string;
  transporterName: string;
  companyName: string | null;
  amount: number;
  status: "LEADING" | "OUTBID";
  submittedAt: string;
}

export interface BidPlacedPayload {
  loadId: string;
  loadNumber: string;
  bid: {
    id: string;
    transporterId: string;
    transporterName: string;
    companyName: string | null;
    amount: number;
    submittedAt: string;
  };
  leaderboard: LeaderboardEntry[];
  totalBids: number;
  lowestBid: number;
}

export interface LoadStatusChangedPayload {
  loadId: string;
  loadNumber: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: string;
}

export interface NewLoadPostedPayload {
  loadId: string;
  loadNumber: string;
  pickupAddress: string;
  dropAddress: string;
  materialType: string;
  weight: number;
  biddingClosesAt: string;
  basePrice: number | null;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "bid" | "load" | "delivery" | "payment" | "system";
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ServerToClientEvents {
  "bid:placed": (data: BidPlacedPayload) => void;
  "bid:accepted": (data: { loadId: string; bidId: string; transporterId: string }) => void;
  "load:status_changed": (data: LoadStatusChangedPayload) => void;
  "load:new": (data: NewLoadPostedPayload) => void;
  "load:closed": (data: { loadId: string; loadNumber: string }) => void;
  "notification": (data: NotificationPayload) => void;
  "error": (data: { message: string }) => void;
  "pong": (data: { timestamp: number }) => void;
}

export interface ClientToServerEvents {
  "join:load": (loadId: string) => void;
  "leave:load": (loadId: string) => void;
  "join:user": (userId: string) => void;
  "join:loadboard": () => void;
  "leave:loadboard": () => void;
  "ping": () => void;
}