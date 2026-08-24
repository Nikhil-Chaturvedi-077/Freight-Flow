"use client";

import {
  Document, Page, Text, View,
  StyleSheet, Font, PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
  },
  brandName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  brandTagline: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "right",
  },
  invoiceNo: {
    fontSize: 11,
    color: "#3b82f6",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  column: { flex: 1, marginRight: 16 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionText: { fontSize: 10, color: "#1a1a1a", lineHeight: 1.6 },
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "8 10",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 10",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  col1: { flex: 5 },
  col2: { flex: 1, textAlign: "center" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  cellText: { fontSize: 10, color: "#374151" },
  totalsBox: {
    marginLeft: "auto",
    width: 220,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalsLabel: { fontSize: 10, color: "#6b7280" },
  totalsValue: { fontSize: 10, color: "#1a1a1a" },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalFinalLabel: { fontSize: 12, fontWeight: "bold", color: "#1a1a1a" },
  totalFinalValue: { fontSize: 12, fontWeight: "bold", color: "#3b82f6" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#9ca3af" },
  badge: {
    padding: "4 10",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgePaid: { backgroundColor: "#d1fae5" },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeText: { fontSize: 9, fontWeight: "bold" },
  badgePaidText: { color: "#065f46" },
  badgePendingText: { color: "#92400e" },
});

interface InvoiceData {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  status: string;
  shipper: {
    name: string;
    company: string;
    email: string;
    gst?: string;
    address?: string;
  };
  transporter: {
    name: string;
    company: string;
    gst?: string;
  };
  load: {
    loadNumber: string;
    route: string;
    material: string;
    weight: string;
  };
  amount: number;
  taxRate: number;
}

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const subtotal = data.amount;
  const tax = subtotal * (data.taxRate / 100);
  const total = subtotal + tax;
  const platformFee = subtotal * 0.025;

  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Freight-Flow</Text>
            <Text style={styles.brandTagline}>
              Direct Load-to-Driver Platform
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNo}>{data.invoiceNo}</Text>
          </View>
        </View>

        {/* Dates + Status */}
        <View style={[styles.section, { marginBottom: 16 }]}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Issue Date</Text>
            <Text style={styles.sectionText}>{data.issueDate}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Due Date</Text>
            <Text style={styles.sectionText}>{data.dueDate}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View
              style={[
                styles.badge,
                data.status === "PAID"
                  ? styles.badgePaid
                  : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  data.status === "PAID"
                    ? styles.badgePaidText
                    : styles.badgePendingText,
                ]}
              >
                {data.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Billed to / From */}
        <View style={styles.section}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Billed To (Shipper)</Text>
            <Text style={[styles.sectionText, { fontWeight: "bold" }]}>
              {data.shipper.company}
            </Text>
            <Text style={styles.sectionText}>{data.shipper.name}</Text>
            <Text style={styles.sectionText}>{data.shipper.email}</Text>
            {data.shipper.gst && (
              <Text style={styles.sectionText}>
                GSTIN: {data.shipper.gst}
              </Text>
            )}
            {data.shipper.address && (
              <Text style={styles.sectionText}>{data.shipper.address}</Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Service Provider (Transporter)</Text>
            <Text style={[styles.sectionText, { fontWeight: "bold" }]}>
              {data.transporter.company}
            </Text>
            <Text style={styles.sectionText}>{data.transporter.name}</Text>
            {data.transporter.gst && (
              <Text style={styles.sectionText}>
                GSTIN: {data.transporter.gst}
              </Text>
            )}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.col1]}>Description</Text>
            <Text style={[styles.headerText, styles.col2]}>Qty</Text>
            <Text style={[styles.headerText, styles.col3]}>Rate</Text>
            <Text style={[styles.headerText, styles.col4]}>Amount</Text>
          </View>

          {/* Freight charge */}
          <View style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.cellText}>
                Freight Transportation Services
              </Text>
              <Text style={[styles.cellText, { fontSize: 9, color: "#6b7280" }]}>
                Load: {data.load.loadNumber} · {data.load.route}
              </Text>
              <Text style={[styles.cellText, { fontSize: 9, color: "#6b7280" }]}>
                {data.load.material} · {data.load.weight}
              </Text>
            </View>
            <Text style={[styles.cellText, styles.col2]}>1</Text>
            <Text style={[styles.cellText, styles.col3]}>{fmt(subtotal)}</Text>
            <Text style={[styles.cellText, styles.col4]}>{fmt(subtotal)}</Text>
          </View>

          {/* Platform fee */}
          <View style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.cellText}>Platform Service Fee (2.5%)</Text>
              <Text style={[styles.cellText, { fontSize: 9, color: "#6b7280" }]}>
                Freight-Flow marketplace fee
              </Text>
            </View>
            <Text style={[styles.cellText, styles.col2]}>1</Text>
            <Text style={[styles.cellText, styles.col3]}>
              {fmt(platformFee)}
            </Text>
            <Text style={[styles.cellText, styles.col4]}>
              {fmt(platformFee)}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {fmt(subtotal + platformFee)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>
              GST ({data.taxRate}%) — IGST
            </Text>
            <Text style={styles.totalsValue}>{fmt(tax)}</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>Total Amount</Text>
            <Text style={styles.totalFinalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View
          style={{
            backgroundColor: "#f9fafb",
            padding: 12,
            borderRadius: 6,
            marginBottom: 24,
          }}
        >
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
            Notes
          </Text>
          <Text style={[styles.sectionText, { color: "#6b7280" }]}>
            This is a system-generated GST-compliant invoice. Payment has
            been processed through Freight-Flow escrow system. For disputes
            contact support@freightflow.in
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Freight-Flow · support@freightflow.in
          </Text>
          <Text style={styles.footerText}>
            This is a computer-generated invoice
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ── Download Button ───────────────────────────────────────
export function InvoiceDownloadButton({ data }: { data: InvoiceData }) {
  return (
    <PDFDownloadLink
      document={<InvoiceDocument data={data} />}
      fileName={`${data.invoiceNo}.pdf`}
    >
      {({ loading }) => (
        <Button size="sm" className="gap-2" disabled={loading}>
          <Download className="size-3.5" />
          {loading ? "Generating…" : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}