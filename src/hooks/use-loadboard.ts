"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import type { NewLoadPostedPayload } from "@/types/socket";

export function useLoadboard(onNewLoad?: (load: NewLoadPostedPayload) => void) {
  const { socket, isConnected } = useSocket();
  const [newLoads, setNewLoads] = useState<NewLoadPostedPayload[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join:loadboard");

    const handleNewLoad = (data: NewLoadPostedPayload) => {
      setNewLoads((prev) => [data, ...prev.slice(0, 9)]);
      onNewLoad?.(data);
    };

    socket.on("load:new", handleNewLoad);

    return () => {
      socket.off("load:new", handleNewLoad);
      socket.emit("leave:loadboard");
    };
  }, [socket, isConnected]);

  return { newLoads };
}