import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/socket";

// Typed socket instance
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false, // Manual connect after auth
    });
  }
  return socket;
}

export function connectSocket(userId: string): AppSocket {
  const s = getSocket();

  if (!s.connected) {
    s.connect();

    s.on("connect", () => {
      console.log("[SOCKET] Connected:", s.id);
      // Join user's personal notification room
      s.emit("join:user", userId);
    });

    s.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
    });

    s.on("connect_error", (err) => {
      console.error("[SOCKET] Connection error:", err.message);
    });
  }

  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}