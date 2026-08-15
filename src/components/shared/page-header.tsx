import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode; // right side actions
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-6 border-b border-[var(--border)]",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="size-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <Icon className="size-4.5 text-[var(--primary)]" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  );
}