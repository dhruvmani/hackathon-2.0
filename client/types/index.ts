export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  releaseYear: number;
  bannerUrl?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedMovies {
  movies: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
