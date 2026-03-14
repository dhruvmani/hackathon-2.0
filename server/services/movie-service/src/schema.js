import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Movie @key(fields: "id") {
    id: ID!
    title: String!
    description: String!
    genre: [String!]!
    releaseYear: Int!
    bannerUrl: String
    createdAt: String!
  }

  type PaginatedMovies {
    movies: [Movie!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type Query {
    movies(page: Int, limit: Int): PaginatedMovies!
    movie(id: ID!): Movie!
  }

  type Mutation {
    addMovie(
      title: String!
      description: String!
      genre: [String!]!
      releaseYear: Int!
    ): Movie!
  }
`;
