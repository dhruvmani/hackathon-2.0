import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external", "@shareable"])

  type Review @key(fields: "id") {
    id: ID!
    movieId: ID!
    userId: ID!
    rating: Int!
    comment: String!
    createdAt: String!
  }

  # Extend Movie from movie-service to attach reviews
  extend type Movie @key(fields: "id") {
    id: ID! @external
    reviews: [Review!]!
  }

  # Extend User from user-service to attach reviews
  extend type User @key(fields: "id") {
    id: ID! @external
    reviews: [Review!]!
  }

  type Query {
    reviewsByMovie(movieId: ID!): [Review!]!
  }

  type Mutation {
    postReview(movieId: ID!, rating: Int!, comment: String!): Review!
  }
`;
