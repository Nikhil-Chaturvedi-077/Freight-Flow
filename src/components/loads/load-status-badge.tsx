import { cn } from "@/lib/utils";
import { LOAD_STATUS_CONFIG } from "@/lib/constants";
import type { LoadStatus } from "@prisma/client";

export function LoadStatusBadge({ status }: { status: LoadStatus }) {
  const config = LOAD_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}