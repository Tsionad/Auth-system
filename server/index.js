// Import dependencies
// import 'dotenv/config';
// import cors from 'cors';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';

// Import local dependencies
import typeDefs from './schema';

// Express server configuration
const app = express();
// const HOST = process.env.HOST || 'https://localhost:4000';
const PORT = process.env.PORT || 4000;

// app.use(cors());

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs,
});

server.applyMiddleware({ app, path: '/graphql' });

// Start server
app.listen(PORT, () => console.log(` Apollo Server started on ${PORT}`));
