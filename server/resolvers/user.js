/* eslint-disable no-return-await */
import { AuthenticationError, UserInputError } from 'apollo-server';

import { createToken } from './auth';

export default {
  Query: {
    users: async (parent, args, { models }) => await models.User.findAll(),
    user: async (parent, { id }, { models }) => await models.User.findById(id),
    me: async (parent, args, { models, me }) => {
      if (!me) {
        return null;
      }

      return await models.User.findById(me.id);
    },
  },

  Mutation: {
    signUp: async (
      parent,
      {
        firstName, lastName, email, password,
      },
      { models, secret },
    ) => {
      const user = await models.User.create({
        firstName,
        lastName,
        email,
        password,
      });

      return { token: createToken(user, secret, '5m') };
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret },
    ) => {
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError(
          'User Not Found',
        );
      }
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        throw new AuthenticationError('Invalid password.');
      }
      return { token: createToken(user, secret, '5m') };
    },
  },
};
