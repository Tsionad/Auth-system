const { gql } = require('apollo-server');

const typeDefs = gql`
  type Query {
    me: User
  }

  type User {
    id: ID!
    email: String!
  }
`;

module.exports = typeDefs;
