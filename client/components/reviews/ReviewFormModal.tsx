"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { Star } from "lucide-react";
import { reviewSchema, ReviewInput } from "@/lib/validations";
import { POST_REVIEW } from "@/lib/graphql/mutations";
import { GET_REVIEWS } from "@/lib/graphql/queries";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { cn } from "@/lib/utils";
import { showToast } from "../ui/Toast";

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: string;
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({ isOpen, onClose, movieId }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const rating = watch("rating");
  const comment = watch("comment");

  const [postReview, { loading }] = useMutation<
    { postReview: any },
    ReviewInput & { movieId: string }
  >(POST_REVIEW, {
    refetchQueries: [{ query: GET_REVIEWS, variables: { movieId } }],
    onCompleted: () => {
      showToast.success("Review posted!");
      onClose();
      reset();
    },
    onError: (err) => {
      showToast.error(err.message);
    },
  });

  const onSubmit = (data: ReviewInput) => {
    postReview({ variables: { ...data, movieId } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Write a Review">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted">Star Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-90"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setValue("rating", star)}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    (hoverRating || rating) >= star
                      ? "text-primary fill-primary"
                      : "text-zinc-600"
                  )}
                />
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="text-xs text-red-500 font-medium">{errors.rating.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-medium text-muted">Comment</label>
            <span className={cn(
              "text-[10px] font-bold",
              comment.length < 10 || comment.length > 500 ? "text-red-500" : "text-muted"
            )}>
              {comment.length}/500
            </span>
          </div>
          <textarea
            {...register("comment")}
            rows={4}
            className={cn(
              "w-full bg-[#333] border-none rounded-lg text-white px-4 py-3 focus:bg-[#454545] focus:ring-2 focus:ring-primary outline-none transition-all duration-200",
              errors.comment && "ring-2 ring-red-500"
            )}
            placeholder="What did you think of the movie?"
          />
          {errors.comment && (
            <p className="text-xs text-red-500 font-medium">{errors.comment.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Post Review
        </Button>
      </form>
    </Modal>
  );
};

export default ReviewFormModal;
