import 'dotenv/config';
import mongoose from 'mongoose';
import { Review } from '../src/models/Review.js';

const COMMENTS = [
  'Absolutely loved it — one of the best films I have seen in years.',
  'Great cinematography but the pacing felt a bit slow in the second act.',
  'A masterpiece. The performances were outstanding across the board.',
  'Entertaining enough, though the plot had a few holes.',
  'Not my genre but I can appreciate the craft that went into it.',
  'Stunning visuals and an incredible score. Highly recommended.',
  'The ending left me speechless. Did not see that coming at all.',
  'Solid film. Nothing groundbreaking but very enjoyable.',
  'The chemistry between the leads really carried the whole movie.',
  'A bit overhyped but still a decent watch for a Friday night.',
  'Genuinely moved me. Rare for a film to hit that hard emotionally.',
  'Good concept, mediocre execution. Could have been so much more.',
  'Rewatched it twice already. Gets better every time.',
  'The third act completely fell apart but the first two were great.',
  'One of those films that stays with you long after the credits roll.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  // Fetch user IDs from user DB
  const userConn = await mongoose.createConnection(process.env.MONGO_URI_USER).asPromise();
  const UserModel = userConn.model('User', new mongoose.Schema({ _id: mongoose.Schema.Types.ObjectId }, { strict: false }));
  const users = await UserModel.find({}, '_id').lean();

  if (users.length === 0) {
    console.error('No users found — run the user seed first.');
    process.exit(1);
  }

  // Fetch movie IDs from movie DB
  const movieConn = await mongoose.createConnection(process.env.MONGO_URI_MOVIE).asPromise();
  const MovieModel = movieConn.model('Movie', new mongoose.Schema({ _id: mongoose.Schema.Types.ObjectId }, { strict: false }));
  const movies = await MovieModel.find({}, '_id').lean();

  if (movies.length === 0) {
    console.error('No movies found — run the movie seed first.');
    process.exit(1);
  }

  // Connect to review DB
  const reviewConn = await mongoose.createConnection(process.env.MONGO_URI_REVIEW).asPromise();
  const ReviewModel = reviewConn.model('Review', Review.schema);

  try {
    await ReviewModel.deleteMany({});
    console.log('Cleared existing reviews');

    // Each user reviews ~8 random movies (no duplicates per user/movie pair)
    const docs = [];
    for (const user of users) {
      const shuffled = [...movies].sort(() => Math.random() - 0.5).slice(0, 8);
      for (const movie of shuffled) {
        docs.push({
          movieId: movie._id.toString(),
          userId: user._id.toString(),
          rating: Math.floor(Math.random() * 5) + 1,
          comment: pick(COMMENTS),
        });
      }
    }

    const inserted = await ReviewModel.insertMany(docs);
    console.log(`Seeded ${inserted.length} reviews (${users.length} users × ~8 movies)`);
  } catch (err) {
    console.error('Review seed failed:', err.message);
    process.exit(1);
  } finally {
    await userConn.close();
    await movieConn.close();
    await reviewConn.close();
    console.log('Disconnected');
  }
}

seed();
