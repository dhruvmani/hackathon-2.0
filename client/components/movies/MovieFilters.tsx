"use client";

import React from "react";
import { Search } from "lucide-react";
import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";

interface MovieFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  genre: string;
  onGenreChange: (val: string) => void;
  year: string;
  onYearChange: (val: string) => void;
  resultsCount: number;
}

const GENRES = [
  { label: "All Genres", value: "" },
  { label: "Action", value: "Action" },
  { label: "Drama", value: "Drama" },
  { label: "Comedy", value: "Comedy" },
  { label: "Thriller", value: "Thriller" },
  { label: "Sci-Fi", value: "Sci-Fi" },
  { label: "Horror", value: "Horror" },
  { label: "Romance", value: "Romance" },
];

const YEARS = [
  { label: "All Years", value: "" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
  { label: "2019", value: "2019" },
  { label: "2018 & earlier", value: "older" },
];

const MovieFilters: React.FC<MovieFiltersProps> = ({
  search,
  onSearchChange,
  genre,
  onGenreChange,
  year,
  onYearChange,
  resultsCount,
}) => {
  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
        
        <Dropdown
          label="Genre"
          options={GENRES}
          value={genre}
          onChange={onGenreChange}
        />

        <Dropdown
          label="Year"
          options={YEARS}
          value={year}
          onChange={onYearChange}
        />
      </div>
      
      <p className="text-sm text-muted">
        {resultsCount} {resultsCount === 1 ? "result" : "results"} found
      </p>
    </div>
  );
};

export default MovieFilters;
