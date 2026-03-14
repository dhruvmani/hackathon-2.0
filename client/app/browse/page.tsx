"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_MOVIES } from "@/lib/graphql/queries";
import Navbar from "@/components/layout/Navbar";
import MovieGrid from "@/components/movies/MovieGrid";
import MovieFilters from "@/components/movies/MovieFilters";
import Pagination from "@/components/ui/Pagination";
import Alert from "@/components/ui/Alert";
import { Movie } from "@/types";

const BrowsePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const limit = 12;

  const { data, loading, error } = useQuery<{
    movies: {
      movies: Movie[];
      total: number;
      totalPages: number;
      currentPage: number;
    };
  }>(GET_MOVIES, {
    variables: { page: currentPage, limit },
  });

  const totalItems = data?.movies?.total || 0;
  const totalPages = data?.movies?.totalPages || 1;

  // Client-side filtering logic
  const filteredMovies = useMemo(() => {
    const movies = data?.movies?.movies || [];
    return movies.filter((movie: Movie) => {
      const matchSearch = movie.title.toLowerCase().includes(search.toLowerCase());
      const matchGenre = genre === "" || movie.genre === genre;
      let matchYear = true;
      if (year === "older") {
        matchYear = movie.releaseYear <= 2018;
      } else if (year !== "") {
        matchYear = movie.releaseYear === parseInt(year);
      }
      return matchSearch && matchGenre && matchYear;
    });
  }, [data, search, genre, year]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Hero placeholder or spacer */}
      <div className="h-20" />

      <main className="px-4 md:px-12 py-8">
        <MovieFilters
          search={search}
          onSearchChange={setSearch}
          genre={genre}
          onGenreChange={setGenre}
          year={year}
          onYearChange={setYear}
          resultsCount={filteredMovies.length}
        />

        {error && (
          <Alert
            variant="error"
            message="Connection error. Please check your network or backend status."
            className="mb-8"
          />
        )}

        {filteredMovies.length === 0 && !loading && !error && (
          <Alert
            variant="info"
            message="No movies match your filters. Try adjusting your search."
            className="mb-8"
          />
        )}

        <MovieGrid movies={filteredMovies} loading={loading} />

        {!loading && filteredMovies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={limit}
          />
        )}
      </main>
    </div>
  );
};

export default BrowsePage;
