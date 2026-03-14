import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// One review per user per movie
reviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
