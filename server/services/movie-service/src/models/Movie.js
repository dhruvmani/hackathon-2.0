import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    genre: [{ type: String, trim: true }],
    releaseYear: { type: Number, required: true },
    bannerUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export const Movie = mongoose.model('Movie', movieSchema);
