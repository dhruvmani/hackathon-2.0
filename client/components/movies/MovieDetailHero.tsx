"use client";

import React from "react";
import { Movie } from "@/types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Calendar, Film, Star } from "lucide-react";

interface MovieDetailHeroProps {
  movie: Movie;
  onWriteReview: () => void;
  averageRating?: number;
}

const MovieDetailHero: React.FC<MovieDetailHeroProps> = ({ 
  movie, 
  onWriteReview,
  averageRating 
}) => {
  return (
    <div className="relative h-[70vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        {movie.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.bannerUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
            <Film className="w-20 h-20 text-muted opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-12 transition-standard">
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant={movie.genre} size="md">{movie.genre}</Badge>
            <div className="flex items-center gap-1.5 text-muted font-bold">
              <Calendar className="w-4 h-4" />
              {movie.releaseYear}
            </div>
            {averageRating && (
              <div className="flex items-center gap-1.5 text-yellow-500 font-bold ml-2">
                <Star className="w-5 h-5 fill-yellow-500" />
                {averageRating.toFixed(1)}
              </div>
            )}
          </div>

          <h1 className="text-6xl md:text-8xl font-bebas tracking-tighter text-white drop-shadow-2xl">
            {movie.title}
          </h1>

          <p className="text-lg md:text-xl text-muted leading-relaxed drop-shadow-lg max-w-2xl">
            {movie.description}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <Button size="lg" onClick={onWriteReview}>
              Write a Review
            </Button>
            <Button variant="secondary" size="lg" className="bg-white/10 backdrop-blur-md border-white/20">
              Add to List
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailHero;
