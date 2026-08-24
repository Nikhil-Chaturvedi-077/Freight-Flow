"use client";

import { useState, useTransition } from "react";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { rateTransporter } from "@/actions/rating.actions";
import { toast } from "sonner";

interface RatingFormProps {
  loadId: string;
  transporterId: string;
  transporterName: string;
}

export function RatingForm({
  loadId,
  transporterId,
  transporterName,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    startTransition(async () => {
      const result = await rateTransporter({
        loadId,
        transporterId,
        rating,
        comment: comment || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSubmitted(true);
      toast.success("Rating submitted!");
    });
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="size-4" />
        Rating submitted. Thank you!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm mb-2 block">
          Rate {transporterName}
        </Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  (hovered || rating) >= star
                    ? "text-amber-400 fill-amber-400"
                    : "text-[var(--border)]"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-[var(--muted-foreground)] ml-2">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      <Textarea
        placeholder="Share your experience (optional)"
        rows={2}
        className="resize-none text-sm"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isPending}
      />

      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!rating || isPending}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Star className="size-3.5" />
        )}
        {isPending ? "Submitting…" : "Submit Rating"}
      </Button>
    </div>
  );
}