/* eslint-disable consistent-return */
// Import dependencies
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import DataLoader from 'dataloader';
import express from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import passport from 'passport';


// Import local dependencies
import schema from './schema';
import resolvers from './resolvers/user';
import models, { sequelize } from './models';
import loaders from './loaders/index';
import { createToken } from './resolvers/auth';


const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

// Express server configuration
const app = express();
// const HOST = process.env.HOST || 'https://localhost:8000';
const port = process.env.PORT || 8000;
const isTest = !!process.env.TEST_DATABASE; // use sqlite3
const isProduction = !!process.env.DATABASE || !!process.env.DATABASE_URL; // use postgres

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: 'http://localhost:8000/auth/linkedin/callback',
    },
    async (req, accessToken, profile, cb) => {
      req.session.accessToken = accessToken;
      req.profile = profile;
      const { id, emails: [{ value }] } = profile;
      // []
      let linkedinUser = await models.User.findOne({
        where: { $or: [{ linkedId: id }, { email: value }] },
      });
      if (!linkedinUser) {
      // # case1 first time login
        linkedinUser = await models.User.create({
          linkedId: id,
          email: value,
          token: accessToken,
        });
      } else if (!linkedinUser.linkedId) {
        // case #3 add email to user
        await linkedinUser.update({
          linkedId: id,
        });
      }
      cb(null, linkedinUser);
    },
  ),
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.post('auth/linkedin/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  async (req, res) => {
    const [token] = await createToken(req.user, process.env.SECRET);
    res.redirect(`http://localhost:8001/home?token=${token}`);
  },
);

const getUser = async (req) => {
  const token = req.headers['x-token'];
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (e) {
      throw new AuthenticationError(
        'Your token has expired. Please login again.',
      );
    }
  }
};

app.use(cors());

const createMockUsers = async () => {
  await models.User.create(
    {
      firstName: 'hello',
      lastName: 'world',
      email: 'helloworld@gmail.com',
      password: 'ilovepizza',
      role: 'ADMIN',
    },
  );
};

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  formatError: (error) => {
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '');

    return {
      ...error,
      message,
    };
  },
  context: async ({ req }) => {
    const me = await getUser(req);
    return {
      models,
      me,
      secret: process.env.SECRET,
      loaders: {
        user: new DataLoader(keys => loaders.user.batchUsers(keys, models)),
      },
    };
  },
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

sequelize.sync({ force: isTest || isProduction }).then(async () => {
  if (isTest) {
    await createMockUsers();
    console.log('Test model has been set...');
  }

  if (isProduction) {
    console.log('Production model has been set....');
  }

  httpServer.listen({ port }, () => {
    console.log(` Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`);
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
  });
});
