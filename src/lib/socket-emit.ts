// Server-side only — Next.js Server Actions se call hoga

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;
const EMIT_SECRET = process.env.SOCKET_EMIT_SECRET!;

async function emitToSocket(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const res = await fetch(`${SOCKET_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: EMIT_SECRET,
        ...payload,
      }),
      // Don't block Server Action on socket emit
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.error(`[SOCKET_EMIT] Failed: ${endpoint}`, await res.text());
    }
  } catch (err) {
    // Never let socket emit crash the main action
    console.error(`[SOCKET_EMIT] Error: ${endpoint}`, err);
  }
}

export async function emitBidPlaced(
  loadId: string,
  data: unknown
): Promise<void> {
  await emitToSocket("/emit/bid-placed", { loadId, data });
}

export async function emitLoadStatusChanged(
  loadId: string,
  userId: string,
  data: unknown
): Promise<void> {
  await emitToSocket("/emit/load-status", { loadId, userId, data });
}

export async function emitNewLoad(data: unknown): Promise<void> {
  await emitToSocket("/emit/new-load", { data });
}

export async function emitNotification(
  userId: string,
  data: unknown
): Promise<void> {
  await emitToSocket("/emit/notification", { userId, data });
}

export async function emitBidAccepted(
  loadId: string,
  transporterId: string,
  data: unknown
): Promise<void> {
  await emitToSocket("/emit/bid-accepted", { loadId, transporterId, data });
}