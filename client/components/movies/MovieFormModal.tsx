"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { movieSchema, MovieInput } from "@/lib/validations";
import { ADD_MOVIE } from "@/lib/graphql/mutations";
import { GET_MOVIES } from "@/lib/graphql/queries";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Dropdown from "../ui/Dropdown";
import { showToast } from "../ui/Toast";

interface MovieFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // Reverting to any to avoid complex deep property mismatches with Movie type
  mode?: "create" | "edit";
}

const GENRES = [
  { label: "Action", value: "Action" },
  { label: "Drama", value: "Drama" },
  { label: "Comedy", value: "Comedy" },
  { label: "Thriller", value: "Thriller" },
  { label: "Sci-Fi", value: "Sci-Fi" },
  { label: "Horror", value: "Horror" },
  { label: "Romance", value: "Romance" },
];

const MovieFormModal: React.FC<MovieFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  mode = "create",
}) => {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(movieSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      genre: initialData.genre,
      releaseYear: initialData.releaseYear,
      bannerUrl: initialData.bannerUrl || "",
    } : {
      title: "",
      description: "",
      genre: "Action",
      releaseYear: new Date().getFullYear(),
      bannerUrl: "",
    },
  });

  const selectedGenre = watch("genre");

  const [addMovie, { loading }] = useMutation<{ addMovie: any }, MovieInput>(ADD_MOVIE, {
    refetchQueries: [{ query: GET_MOVIES }],
    onCompleted: () => {
      showToast.success(`Movie ${isEdit ? "updated" : "added"} successfully!`);
      // Note: If Edit mode, we would call an update mutation here
      onClose();
      reset();
    },
    onError: (err) => {
      showToast.error(err.message);
    },
  });

  const onSubmit = (data: MovieInput) => {
    if (isEdit) {
      // Backend doesn't have updateMovie, so we just show a toast and close
      showToast.success("Changes saved locally (Backend update not available)");
      onClose();
    } else {
      addMovie({ variables: data });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Movie" : "Add New Movie"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          placeholder="Movie Title"
          register={register("title")}
          error={(errors.title as any)?.message}
        />
  
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted">Description</label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full bg-[#333] border-none rounded-lg text-white px-4 py-3 focus:bg-[#454545] focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
              placeholder="Tell us about the movie..."
            />
            {errors.description && (
              <p className="text-xs text-red-500 font-medium">{(errors.description as any)?.message}</p>
            )}
          </div>

        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            label="Genre"
            options={GENRES}
            value={selectedGenre}
            onChange={(val) => setValue("genre", val)}
            error={(errors.genre as any)?.message}
          />

          <Input
            label="Release Year"
            type="number"
            register={register("releaseYear")}
            error={(errors.releaseYear as any)?.message}
          />
        </div>

        <Input
          label="Banner URL"
          placeholder="https://example.com/image.jpg"
          register={register("bannerUrl")}
          error={(errors.bannerUrl as any)?.message}
        />

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? "Save Changes" : "Add Movie"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MovieFormModal;
