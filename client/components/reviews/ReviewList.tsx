"use client";

import React, { useState } from "react";
import { Review } from "@/types";
import ReviewCard from "./ReviewCard";
import Alert from "../ui/Alert";
import Button from "../ui/Button";

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-surface border border-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return <Alert variant="info" message="Be the first to review this movie" />;
  }

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = reviews.length > visibleCount;

  return (
    <div className="space-y-4">
      {visibleReviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((prev) => prev + 5)}
          >
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
