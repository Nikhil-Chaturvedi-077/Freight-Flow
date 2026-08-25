"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Props {
  data: {
    month: string;
    revenue: number;
    fee: number;
  }[];
}

export function AdminRevenueChart({ data }: Props) {
  if (data.length === 0 || data.every((d) => d.revenue === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
        No revenue data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{
          top: 4,
          right: 4,
          left: -20,
          bottom: 0,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
        />

        <XAxis
          dataKey="month"
          tick={{
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) =>
            `₹${(value / 1000).toFixed(0)}k`
          }
        />

        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--foreground)",
          }}
          formatter={(value, name) => {
            const numericValue =
              typeof value === "number"
                ? value
                : Number(value ?? 0);

            const label =
              name === "revenue"
                ? "Escrow Volume"
                : "Platform Fee";

            return [
              `₹${numericValue.toLocaleString("en-IN")}`,
              label,
            ];
          }}
        />

        <Legend
          formatter={(value) =>
            value === "revenue"
              ? "Escrow Volume"
              : "Platform Fee (2.5%)"
          }
        />

        <Bar
          dataKey="revenue"
          fill="var(--primary)"
          radius={[4, 4, 0, 0]}
          opacity={0.7}
        />

        <Bar
          dataKey="fee"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}