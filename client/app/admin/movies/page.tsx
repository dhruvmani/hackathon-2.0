"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { GET_MOVIES } from "@/lib/graphql/queries";
import { DELETE_MOVIE } from "@/lib/graphql/mutations";
import Sidebar from "@/components/layout/Sidebar";
import MovieTable from "@/components/movies/MovieTable";
import MovieFormModal from "@/components/movies/MovieFormModal";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { showToast } from "@/components/ui/Toast";
import { Movie } from "@/types";

const AdminMoviesPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const limit = 10;

  const { data, loading, refetch } = useQuery<{
    movies: {
      movies: Movie[];
      total: number;
      totalPages: number;
    }
  }>(GET_MOVIES, {
    variables: { page: currentPage, limit },
  });

  const totalItems = data?.movies?.total || 0;
  const totalPages = data?.movies?.totalPages || 1;

  const [deleteMovie, { loading: isDeleting }] = useMutation(DELETE_MOVIE, {
    onCompleted: () => {
      showToast.success("Movie deleted successfully");
      setIsDeleteModalOpen(false);
      refetch();
    },
    onError: (err) => showToast.error(err.message),
  });

  const filteredMovies = useMemo(() => {
    const movies = data?.movies?.movies || [];
    return movies.filter((m: Movie) =>
      m.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const handleEdit = (movie: Movie) => {
    setSelectedMovie(movie);
    setFormMode("edit");
    setIsFormModalOpen(true);
  };

  const handleDelete = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMovie) {
      deleteMovie({ variables: { id: selectedMovie.id } });
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bebas tracking-wider mb-2">Manage Movies</h1>
            <p className="text-muted text-sm">{totalItems} movies total in database</p>
          </div>
          
          <Button 
            icon={<Plus className="w-5 h-5" />} 
            onClick={() => {
              setFormMode("create");
              setSelectedMovie(null);
              setIsFormModalOpen(true);
            }}
          >
            Add Movie
          </Button>
        </div>

        <div className="bg-surface p-6 rounded-lg border border-border mb-8">
          <div className="max-w-md mb-6">
            <Input
              placeholder="Search movies by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>

          <MovieTable
            movies={filteredMovies}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {!loading && totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={limit}
            />
          )}
        </div>
      </main>

      <MovieFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={formMode}
        initialData={selectedMovie || undefined}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Movie"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-red-500 bg-red-500/10 p-4 rounded-lg">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">
              Are you sure you want to delete <span className="font-bold underline">&quot;{selectedMovie?.title}&quot;</span>? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminMoviesPage;
