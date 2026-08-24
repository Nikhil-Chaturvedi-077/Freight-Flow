import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { InvoiceDownloadButton } from "@/components/invoices/invoice-pdf";
import { FileText } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { format } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "GST Invoices" };
export const experimental_ppr = true;

async function InvoicesList({ shipperId }: { shipperId: string }) {
  const loads = await prisma.load.findMany({
    where: {
      shipperId,
      status: "DELIVERED",
      escrowTransaction: { isReleased: true },
    },
    orderBy: { deliveredAt: "desc" },
    include: {
      escrowTransaction: true,
      acceptedBid: {
        include: {
          transporter: {
            select: {
              name: true,
              companyName: true,
              gstNumber: true,
            },
          },
        },
      },
      shipper: {
        select: {
          name: true,
          companyName: true,
          email: true,
          gstNumber: true,
        },
      },
    },
  });

  if (loads.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        description="Invoices are generated automatically after successful delivery and escrow release"
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        {[
          { label: "Invoice", span: 2 },
          { label: "Load", span: 2 },
          { label: "Route", span: 3 },
          { label: "Amount", span: 2 },
          { label: "Delivered", span: 2 },
          { label: "", span: 1 },
        ].map((h) => (
          <div
            key={h.label}
            className={cn(
              "text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]",
              `col-span-${h.span}`
            )}
          >
            {h.label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {loads.map((load, index) => {
          const amount = load.escrowTransaction?.amount ?? 0;
          const taxRate = 18;
          const invoiceNo = `FF-INV-${format(load.deliveredAt ?? new Date(), "yyyyMM")}-${String(index + 1).padStart(4, "0")}`;

          const invoiceData = {
            invoiceNo,
            issueDate: format(load.deliveredAt ?? new Date(), "dd MMM yyyy"),
            dueDate: format(load.deliveredAt ?? new Date(), "dd MMM yyyy"),
            status: "PAID",
            shipper: {
              name: load.shipper.name ?? "",
              company: load.shipper.companyName ?? load.shipper.name ?? "",
              email: load.shipper.email ?? "",
              gst: load.shipper.gstNumber ?? undefined,
            },
            transporter: {
              name: load.acceptedBid?.transporter.name ?? "",
              company:
                load.acceptedBid?.transporter.companyName ??
                load.acceptedBid?.transporter.name ??
                "",
              gst: load.acceptedBid?.transporter.gstNumber ?? undefined,
            },
            load: {
              loadNumber: load.loadNumber,
              route: `${load.pickupAddress.split(",")[0]} → ${load.dropAddress.split(",")[0]}`,
              material: load.materialType.toLowerCase(),
              weight: `${load.weight} MT`,
            },
            amount,
            taxRate,
          };

          return (
            <div
              key={load.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 hover:bg-[var(--muted)]/20 transition-colors"
            >
              {/* Invoice no */}
              <div className="md:col-span-2">
                <p className="font-mono text-xs font-semibold text-[var(--primary)]">
                  {invoiceNo}
                </p>
                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium mt-0.5">
                  PAID
                </span>
              </div>

              {/* Load */}
              <div className="md:col-span-2">
                <p className="font-mono text-xs font-medium text-[var(--primary)]">
                  {load.loadNumber}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 capitalize">
                  {load.materialType.toLowerCase()} · {load.weight} MT
                </p>
              </div>

              {/* Route */}
              <div className="md:col-span-3">
                <p className="text-xs">
                  {load.pickupAddress.split(",")[0]}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  → {load.dropAddress.split(",")[0]}
                </p>
              </div>

              {/* Amount */}
              <div className="md:col-span-2">
                <p className="text-sm font-semibold">
                  {formatCurrency(amount * 1.18)}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  incl. 18% GST
                </p>
              </div>

              {/* Date */}
              <div className="md:col-span-2">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {load.deliveredAt
                    ? formatDateTime(load.deliveredAt)
                    : "—"}
                </p>
              </div>

              {/* Download */}
              <div className="md:col-span-1 flex items-center justify-end">
                <InvoiceDownloadButton data={invoiceData} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ShipperInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="GST Invoices"
        description="Download GST-compliant invoices for completed deliveries"
        icon={FileText}
      />

      <Suspense
        fallback={
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3.5 border-b border-[var(--border)] last:border-0"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        }
      >
        <InvoicesList shipperId={session.user.id} />
      </Suspense>
    </div>
  );
}