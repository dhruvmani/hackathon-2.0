import 'dotenv/config';
import mongoose from 'mongoose';
import { Movie } from '../src/models/Movie.js';

const GENRES = [
  'Action', 'Drama', 'Comedy', 'Thriller', 'Horror',
  'Sci-Fi', 'Romance', 'Documentary', 'Animation', 'Crime',
];

const DIRECTORS = [
  'Christopher Nolan', 'Martin Scorsese', 'Quentin Tarantino',
  'Steven Spielberg', 'Denis Villeneuve', 'Greta Gerwig',
  'Jordan Peele', 'Bong Joon-ho', 'Alfonso Cuarón', 'David Fincher',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, min = 1, max = 3) {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const movies = Array.from({ length: 50 }, (_, i) => ({
  title: `${pick(['The', 'A', 'Last', 'Dark', 'Silent', 'Broken', 'Lost', 'Rising', 'Fallen', 'Hidden'])} ${pick(['Storm', 'Echo', 'Shadow', 'Horizon', 'Ember', 'Tide', 'Veil', 'Pulse', 'Drift', 'Spark'])} ${i + 1}`,
  description: `A gripping ${pick(GENRES).toLowerCase()} story directed by ${pick(DIRECTORS)} that follows an unlikely hero through extraordinary circumstances, challenging everything they thought they knew about the world around them.`,
  genre: pickMany(GENRES),
  releaseYear: 2000 + Math.floor(Math.random() * 25),
  bannerUrl: null,
}));

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI_MOVIE);
    console.log('Connected to MongoDB');

    await Movie.deleteMany({});
    console.log('Cleared existing movies');

    const inserted = await Movie.insertMany(movies);
    console.log(`Seeded ${inserted.length} movies`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

seed();
