import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-xl border border-[var(--border)] border-dashed",
        "bg-[var(--muted)]/20 px-6 py-14",
        className
      )}
    >
      <div
        className="size-12 rounded-xl bg-[var(--muted)]
                   flex items-center justify-center mb-4"
      >
        <Icon className="size-5 text-[var(--muted-foreground)]" />
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">
        {title}
      </p>
      <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}