import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subVariant?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  subVariant = "neutral",
  icon: Icon,
  iconColor,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--metric-bg)] p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        {Icon && (
          <div
            className={cn(
              "size-7 rounded-md flex items-center justify-center",
              iconColor ?? "bg-[var(--primary)]/10"
            )}
          >
            <Icon
              className={cn(
                "size-3.5",
                iconColor ? "text-current" : "text-[var(--primary)]"
              )}
            />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {sub && (
          <p
            className={cn(
              "text-xs mt-0.5",
              subVariant === "up" && "text-emerald-500",
              subVariant === "down" && "text-red-500",
              subVariant === "neutral" && "text-[var(--muted-foreground)]"
            )}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}