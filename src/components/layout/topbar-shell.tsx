import { cn } from "@/lib/utils";

export function TopbarShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "h-14 shrink-0 flex items-center justify-between px-4 lg:px-6",
        "border-b border-[var(--border)] bg-[var(--topbar-bg)]",
        "sticky top-0 z-20 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </header>
  );
}

export function TopbarLeft({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

export function TopbarRight({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}