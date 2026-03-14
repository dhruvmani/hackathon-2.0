"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Movie } from "@/types";
import { cn, truncate } from "@/lib/utils";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

interface MovieCardProps {
  movie: Movie;
  averageRating?: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, averageRating }) => {
  const initials = movie.title
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group relative aspect-[2/3] netflix-card transition-all duration-300 hover:scale-105 hover:z-10 shadow-xl">
      {/* Banner */}
      <div className="absolute inset-0 bg-[#333] flex items-center justify-center">
        {movie.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.bannerUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-4xl font-bebas text-muted opacity-50">{initials}</div>
        )}
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 z-20">
        <Badge variant={movie.genre}>{movie.genre}</Badge>
      </div>
      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-black/50 border-white/20 text-white">{movie.releaseYear}</Badge>
      </div>

      {/* Title (Always visible bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <h3 className="text-white font-bold group-hover:opacity-0 transition-opacity duration-200">
          {movie.title}
        </h3>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col p-6">
        <div className="flex-1">
          <h3 className="text-xl font-bebas tracking-wide mb-2">{movie.title}</h3>
          <p className="text-xs text-muted mb-4 line-clamp-3">
            {truncate(movie.description, 100)}
          </p>
          
          {averageRating && (
            <div className="flex items-center gap-1 mb-4">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <Link href={`/movies/${movie.id}`} className="w-full">
          <Button variant="primary" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;
