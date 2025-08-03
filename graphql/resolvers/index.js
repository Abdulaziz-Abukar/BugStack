const { Email } = require("../scalars/EmailScalar");
const { Date } = require("../scalars/DateScalar");
const userResolver = require("./userResolvers");
const projectResolvers = require("./projectResolvers");

const resolvers = {
  Email,
  Date,

  Query: {
    ...userResolver.Query,
    ...projectResolvers.Query,
  },

  Mutation: {
    ...userResolver.Mutation,
    ...projectResolvers.Mutation,
  },
};

module.exports = resolvers;
