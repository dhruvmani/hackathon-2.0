"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_MOVIE, GET_REVIEWS } from "@/lib/graphql/queries";
import Navbar from "@/components/layout/Navbar";
import MovieDetailHero from "@/components/movies/MovieDetailHero";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewFormModal from "@/components/reviews/ReviewFormModal";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { Movie } from "@/types";

const MovieDetailPage = () => {
  const { id } = useParams();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: movieData, loading: movieLoading, error: movieError } = useQuery<{
    movie: Movie;
  }>(GET_MOVIE, {
    variables: { id },
  });

  const { data: reviewsData, loading: reviewsLoading } = useQuery<{
    reviewsByMovie: any[];
  }>(GET_REVIEWS, {
    variables: { movieId: id },
  });

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (movieError || !movieData?.movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="p-12">
          <Alert variant="error" title="Movie not found" message="We couldn't find the movie you're looking for." />
        </div>
      </div>
    );
  }

  const movie = movieData.movie;
  const reviews = reviewsData?.reviewsByMovie || [];
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length 
    : undefined;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <MovieDetailHero 
        movie={movie} 
        onWriteReview={() => setIsReviewModalOpen(true)}
        averageRating={averageRating}
      />

      <section className="px-4 md:px-12 mt-16 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bebas tracking-wide">
            Reviews ({reviews.length})
          </h2>
        </div>

        <ReviewList reviews={reviews} loading={reviewsLoading} />
      </section>

      <ReviewFormModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
        movieId={id as string} 
      />
    </div>
  );
};

export default MovieDetailPage;
