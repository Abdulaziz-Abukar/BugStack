const { Email } = require("../scalars/EmailScalar");
const { Date } = require("../scalars/DateScalar");
const userResolver = require("./userResolvers");
const projectResolvers = require("./projectResolvers");
const issueResolvers = require("./issueResolvers");

const resolvers = {
  Email,
  Date,

  Query: {
    ...userResolver.Query,
    ...projectResolvers.Query,
    ...issueResolvers.Query,
  },

  Mutation: {
    ...userResolver.Mutation,
    ...projectResolvers.Mutation,
    ...issueResolvers.Mutation,
  },

  Project: projectResolvers.Project,
};

module.exports = resolvers;
