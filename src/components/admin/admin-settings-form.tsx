"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Shield, Bell, Zap } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";

export function AdminSettingsForm() {
  const [settings, setSettings] = useState({
    kycRequired: true,
    autoEscrowRelease: false,
    newLoadNotifications: true,
    maintenanceMode: false,
    rateLimitEnabled: true,
  });

  function handleSave() {
    // In production: persist to DB or env
    toast.success("Settings saved (demo mode — changes are not persisted)");
  }

  return (
    <div className="space-y-4">
      {/* Platform Flags */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Platform Flags</h3>
        </div>
        <Separator />

        {[
          {
            key: "kycRequired" as const,
            label: "KYC Required for Bidding",
            desc: "Transporters must be KYC verified before placing bids",
          },
          {
            key: "autoEscrowRelease" as const,
            label: "Auto Escrow Release",
            desc: "Automatically release escrow 48h after delivery confirmation",
          },
          {
            key: "rateLimitEnabled" as const,
            label: "Bid Rate Limiting",
            desc: "Enforce 30-second cooldown between bid modifications",
          },
          {
            key: "maintenanceMode" as const,
            label: "Maintenance Mode",
            desc: "Disable new load postings and bids platform-wide",
          },
        ].map((setting) => (
          <div
            key={setting.key}
            className="flex items-center justify-between py-2"
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium">{setting.label}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {setting.desc}
              </p>
            </div>
            <Switch
              checked={settings[setting.key]}
              onCheckedChange={(v) =>
                setSettings((prev) => ({ ...prev, [setting.key]: v }))
              }
            />
          </div>
        ))}
      </div>

      {/* Plan Limits Display */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Plan Limits</h3>
          <Badge variant="outline" className="text-[10px] ml-auto">
            Read-only — set in constants.ts
          </Badge>
        </div>
        <Separator />

        <div className="space-y-3">
          {(["FREE", "PRO", "ENTERPRISE"] as const).map((plan) => {
            const limits = PLAN_LIMITS[plan];
            return (
              <div
                key={plan}
                className="flex items-center justify-between rounded-lg bg-[var(--muted)]/40 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      plan === "FREE"
                        ? "text-slate-500 text-[10px]"
                        : plan === "PRO"
                        ? "text-blue-500 border-blue-500/30 bg-blue-500/10 text-[10px]"
                        : "text-amber-500 border-amber-500/30 bg-amber-500/10 text-[10px]"
                    }
                  >
                    {plan}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>
                    Members:{" "}
                    <strong className="text-[var(--foreground)]">
                      {limits.members === Infinity ? "∞" : limits.members}
                    </strong>
                  </span>
                  <span>
                    Projects:{" "}
                    <strong className="text-[var(--foreground)]">
                      {limits.projects === Infinity ? "∞" : limits.projects}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform fee */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold">Fee Configuration</h3>
          <Badge variant="outline" className="text-[10px] ml-auto">
            Read-only
          </Badge>
        </div>
        <Separator />

        <div className="space-y-2">
          {[
            { label: "Platform Fee", value: "2.5% of escrow amount" },
            { label: "GST on Platform Fee", value: "18% (IGST)" },
            { label: "Bid Rate Limit", value: "30 seconds between updates" },
            { label: "Bidding Minimum", value: "₹1 (no minimum enforced)" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex justify-between text-sm py-1.5 border-b border-[var(--border)] last:border-0"
            >
              <span className="text-[var(--muted-foreground)]">
                {item.label}
              </span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="gap-2">
        <Save className="size-4" />
        Save Settings
      </Button>
    </div>
  );
}