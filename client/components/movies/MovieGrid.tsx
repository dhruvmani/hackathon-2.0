"use client";

import React from "react";
import { Movie } from "@/types";
import MovieCard from "./MovieCard";
import Spinner from "../ui/Spinner";

interface MovieGridProps {
  movies: Movie[];
  loading?: boolean;
}

const MovieGrid: React.FC<MovieGridProps> = ({ movies, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
