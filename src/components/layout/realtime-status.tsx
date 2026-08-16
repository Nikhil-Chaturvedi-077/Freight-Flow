"use client";

import { useSocket } from "@/components/providers/socket-provider";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export function RealtimeStatus() {
  const { connectionState } = useSocket();

  const config = {
    connected: {
      dot: "bg-emerald-500",
      pulse: true,
      label: "Realtime connected",
      icon: Wifi,
      text: "Live",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    connecting: {
      dot: "bg-amber-500",
      pulse: true,
      label: "Connecting to realtime...",
      icon: Loader2,
      text: "Connecting",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    disconnected: {
      dot: "bg-slate-400",
      pulse: false,
      label: "Realtime disconnected",
      icon: WifiOff,
      text: "Offline",
      textColor: "text-slate-500",
    },
    error: {
      dot: "bg-red-500",
      pulse: false,
      label: "Connection error",
      icon: WifiOff,
      text: "Error",
      textColor: "text-red-500",
    },
  }[connectionState];

  const Icon = config.icon;

  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1.5 cursor-default">
            <div
              className={cn(
                "size-1.5 rounded-full",
                config.dot,
                config.pulse && "animate-pulse"
              )}
            />
            <span className={cn("text-xs hidden sm:block", config.textColor)}>
              {config.text}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {config.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}