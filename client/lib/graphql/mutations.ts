import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const ADD_MOVIE = gql`
  mutation AddMovie($title: String!, $description: String!, $genre: String!, $releaseYear: Int!) {
    addMovie(title: $title, description: $description, genre: $genre, releaseYear: $releaseYear) {
      id
      title
      description
      genre
      releaseYear
      createdAt
    }
  }
`;

export const POST_REVIEW = gql`
  mutation PostReview($movieId: ID!, $rating: Int!, $comment: String!) {
    postReview(movieId: $movieId, rating: $rating, comment: $comment) {
      id
      movieId
      userId
      rating
      comment
      createdAt
    }
  }
`;

export const DELETE_MOVIE = gql`
  mutation DeleteMovie($id: ID!) {
    deleteMovie(id: $id)
  }
`;
