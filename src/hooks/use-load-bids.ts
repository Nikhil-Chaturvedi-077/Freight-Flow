"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import type { BidPlacedPayload, LeaderboardEntry } from "@/types/socket";

interface UseLoadBidsOptions {
  loadId: string;
  initialLeaderboard?: LeaderboardEntry[];
  initialLowestBid?: number;
  initialTotalBids?: number;
}

export function useLoadBids({
  loadId,
  initialLeaderboard = [],
  initialLowestBid = 0,
  initialTotalBids = 0,
}: UseLoadBidsOptions) {
  const { socket, isConnected } = useSocket();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [lowestBid, setLowestBid] = useState(initialLowestBid);
  const [totalBids, setTotalBids] = useState(initialTotalBids);
  const [lastBid, setLastBid] = useState<BidPlacedPayload["bid"] | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected || !loadId) return;

    // Join load room
    socket.emit("join:load", loadId);

    // Listen for new bids
    const handleBidPlaced = (data: BidPlacedPayload) => {
      if (data.loadId !== loadId) return;

      setLeaderboard(data.leaderboard);
      setLowestBid(data.lowestBid);
      setTotalBids(data.totalBids);
      setLastBid(data.bid);

      // Flash animation trigger
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 800);
    };

    socket.on("bid:placed", handleBidPlaced);

    return () => {
      socket.off("bid:placed", handleBidPlaced);
      socket.emit("leave:load", loadId);
    };
  }, [socket, isConnected, loadId]);

  return {
    leaderboard,
    lowestBid,
    totalBids,
    lastBid,
    isFlashing,
  };
}