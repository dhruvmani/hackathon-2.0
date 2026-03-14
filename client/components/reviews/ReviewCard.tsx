import React from "react";
import { Star } from "lucide-react";
import { Review } from "@/types";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="p-6 bg-surface border border-border rounded-lg space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-zinc-600"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
      </div>
      
      <p className="text-white text-sm leading-relaxed">
        {review.comment}
      </p>
      
      <div className="pt-2">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          Anonymous User
        </span>
      </div>
    </div>
  );
};

// Add cn import since I missed it in the template
import { cn } from "@/lib/utils";

export default ReviewCard;
