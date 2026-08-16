"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import type { LoadStatusChangedPayload } from "@/types/socket";
import type { LoadStatus } from "@prisma/client";

export function useLoadStatus(
  loadId: string,
  initialStatus: LoadStatus
) {
  const { socket, isConnected } = useSocket();
  const [status, setStatus] = useState<LoadStatus>(initialStatus);
  const [lastChanged, setLastChanged] = useState<Date | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join:load", loadId);

    const handleStatusChange = (data: LoadStatusChangedPayload) => {
      if (data.loadId !== loadId) return;
      setStatus(data.newStatus as LoadStatus);
      setLastChanged(new Date(data.updatedAt));
    };

    socket.on("load:status_changed", handleStatusChange);

    return () => {
      socket.off("load:status_changed", handleStatusChange);
    };
  }, [socket, isConnected, loadId]);

  return { status, lastChanged };
}