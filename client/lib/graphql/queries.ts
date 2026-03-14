import { gql } from "@apollo/client";

export const GET_MOVIES = gql`
  query GetMovies($page: Int, $limit: Int) {
    movies(page: $page, limit: $limit) {
      movies {
        id
        title
        description
        genre
        releaseYear
        bannerUrl
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_MOVIE = gql`
  query GetMovie($id: ID!) {
    movie(id: $id) {
      id
      title
      description
      genre
      releaseYear
      bannerUrl
      createdAt
    }
  }
`;

export const GET_REVIEWS = gql`
  query GetReviewsByMovie($movieId: ID!) {
    reviewsByMovie(movieId: $movieId) {
      id
      movieId
      userId
      rating
      comment
      createdAt
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      createdAt
    }
  }
`;
