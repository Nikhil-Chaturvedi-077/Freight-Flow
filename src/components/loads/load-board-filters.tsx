"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { MATERIAL_TYPES } from "@/lib/constants";
import { Route } from "next";

export function LoadBoardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const material = searchParams.get("material") ?? "ALL";
  const minWeight = searchParams.get("minWeight") ?? "";
  const maxWeight = searchParams.get("maxWeight") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  const hasFilters =
    material !== "ALL" || minWeight || maxWeight || sort !== "newest";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "ALL" || value === "newest") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  function clearFilters() {
    router.push("/transporter/loads" as Route);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
        <SlidersHorizontal className="size-3.5" />
        Filters:
      </div>

      {/* Material type */}
      <Select
        value={material}
        onValueChange={(v) => updateParam("material", v ?? "")}
      >
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Materials</SelectItem>
          {MATERIAL_TYPES.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Weight range */}
      <Input
        type="number"
        placeholder="Min MT"
        className="h-8 text-xs w-20"
        defaultValue={minWeight}
        onBlur={(e) => updateParam("minWeight", e.target.value)}
      />
      <span className="text-xs text-[var(--muted-foreground)]">—</span>
      <Input
        type="number"
        placeholder="Max MT"
        className="h-8 text-xs w-20"
        defaultValue={maxWeight}
        onBlur={(e) => updateParam("maxWeight", e.target.value)}
      />

      {/* Sort */}
      <Select
        value={sort}
        onValueChange={(v) => updateParam("sort", v ?? "")}
      >
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="closing_soon">Closing soon</SelectItem>
          <SelectItem value="weight_desc">Heaviest first</SelectItem>
          <SelectItem value="weight_asc">Lightest first</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1.5 text-[var(--muted-foreground)]"
          onClick={clearFilters}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}