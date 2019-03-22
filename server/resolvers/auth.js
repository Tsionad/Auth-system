/* eslint-disable no-return-await */
import { ForbiddenError } from 'apollo-server';
import { combineResolvers, skip } from 'graphql-resolvers';
import jwt from 'jsonwebtoken';


export const createToken = async (user, secret, expiresIn) => {
  const {
    id, email, role,
  } = user;
  return await jwt.sign({
    id, email, role,
  }, secret, {
    expiresIn,
  });
};
export const requiresAuth = (parent, args, { me }) => (me ? skip : new ForbiddenError('Not authenticated.'));

export const requiresAdmin = combineResolvers(
  requiresAuth,
  (parent, args, { me: { role } }) => (role === 'ADMIN'
    ? skip
    : new ForbiddenError('Requires authorized access')),
);
