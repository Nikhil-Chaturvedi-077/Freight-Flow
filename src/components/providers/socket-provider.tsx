"use client";

import {
  createContext, useContext, useEffect,
  useRef, useState, useCallback,
} from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { AppSocket } from "@/lib/socket";
import type { NotificationPayload } from "@/types/socket";
import { toast } from "sonner";

type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface SocketContextType {
  socket: AppSocket | null;
  connectionState: ConnectionState;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connectionState: "disconnected",
  isConnected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function SocketProvider({ children, userId }: SocketProviderProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const socketRef = useRef<AppSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    const s = connectSocket(userId);
    socketRef.current = s;

    s.on("connect", () => {
      setConnectionState("connected");

      // Start keep-alive ping (important for Render)
      pingIntervalRef.current = setInterval(() => {
        s.emit("ping");
      }, 25000); // Every 25 seconds
    });

    s.on("disconnect", () => {
      setConnectionState("disconnected");
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    });

    s.on("connect_error", () => {
      setConnectionState("error");
    });

    // Global notification handler
    s.on("notification", (data: NotificationPayload) => {
      const icons = {
        bid: "🏷️",
        load: "📦",
        delivery: "✅",
        payment: "💰",
        system: "🔔",
      };

      toast(data.title, {
        description: data.body,
        icon: icons[data.type],
        duration: 5000,
      });
    });

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      disconnectSocket();
    };
  }, [userId]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connectionState,
        isConnected: connectionState === "connected",
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}