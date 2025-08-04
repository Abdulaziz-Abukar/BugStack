const { GraphQLError } = require("graphql");
const {
  requireAuth,
  handleGraphQLError,
  validateResourceExists,
} = require("../../utils/authHelpers");
const User = require("../../models/User");
const { signToken } = require("../../utils/auth");
const bcrypt = require("bcrypt");

const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      requireAuth(user);
      return await User.findById(user.id); // populate with projects soon.
    },
  },

  Mutation: {
    signup: async (_, { input }) => {
      try {
        const existing = await User.findOne({ email: input.email });

        if (existing)
          throw new GraphQLError(
            "this email is being used on an existing account."
          );

        const newUser = await User.create(input);
        const token = signToken(newUser);

        return { token, user: newUser };
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    login: async (_, { input }) => {
      try {
        const user = await User.findOne({ email: input.email });

        validateResourceExists(user, "name or password");

        const isValid = await bcrypt.compare(input.password, user.password);

        validateResourceExists(isValid, "name or password");

        const token = signToken(user);
        return { token, user };
      } catch (err) {
        handleGraphQLError(err);
      }
    },
  },
};

module.exports = userResolvers;
