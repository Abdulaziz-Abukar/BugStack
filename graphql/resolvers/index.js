const { Email } = require("../scalars/EmailScalar");
const { Date } = require("../scalars/DateScalar");
const userResolver = require("./userResolvers");

const resolvers = {
  Email,
  Date,

  Query: {
    ...userResolver.Query,
  },

  Mutation: {
    ...userResolver.Mutation,
  },
};

module.exports = resolvers;
