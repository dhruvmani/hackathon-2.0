"use client";

import React from "react";
import { Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { Movie } from "@/types";
import Table, { Column } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

interface MovieTableProps {
  movies: Movie[];
  loading?: boolean;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
}

const MovieTable: React.FC<MovieTableProps> = ({ movies, loading, onEdit, onDelete }) => {
  const columns: Column<Movie>[] = [
    {
      header: "#",
      accessor: (m) => <span className="text-muted font-mono">{m.id.toString().slice(-4)}</span>,
      className: "w-16",
    },
    {
      header: "Banner",
      accessor: (m) => (
        <div className="w-10 h-14 bg-[#333] rounded overflow-hidden flex items-center justify-center">
          {m.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted" />
          )}
        </div>
      ),
      className: "w-20",
    },
    {
      header: "Title",
      accessor: "title",
      className: "font-bold",
    },
    {
      header: "Genre",
      accessor: (m) => <Badge variant={m.genre}>{m.genre}</Badge>,
    },
    {
      header: "Year",
      accessor: (m) => m.releaseYear.toString(),
    },
    {
      header: "Actions",
      accessor: (m) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(m)}
            className="p-2 h-auto text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(m)}
            className="p-2 h-auto text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: "w-24 text-right",
    },
  ];

  return (
    <Table
      columns={columns}
      data={movies}
      loading={loading}
      emptyMessage="No movies found. Add one to see it here!"
    />
  );
};

export default MovieTable;
