const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");

function requireAuth(user) {
  if (!user) {
    throw new GraphQLError("Not authenticated");
  }
}

function handleGraphQLError(error) {
  const message = error?.message || "Something went wrong";
  console.error(message);
  throw new GraphQLError(message);
}

function validateObjectId(id, fieldName = "ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new GraphQLError(`Invalid ${fieldName} submitted`);
  }
}

function validateResourceExists(resource, name = "Resource") {
  if (!resource) {
    throw new GraphQLError(`${name} not found`);
  }
}

function checkProjectAccess(
  resource,
  user,
  errorMessage = "Not authorized to access this resource"
) {
  if (
    String(resource.host._id || resource.host.id) !== String(user._id) &&
    !resource.members.some(
      (member) => String(member._id || member.id) === String(user._id)
    )
  ) {
    throw new GraphQLError(errorMessage);
  }
}

function checkHostAccess(
  resource,
  user,
  errorMessage = "Only the host can perform this action"
) {
  if (String(resource.host._id || resource.host.id) !== String(user._id)) {
    throw new GraphQLError(errorMessage);
  }
}

module.exports = {
  requireAuth,
  handleGraphQLError,
  validateObjectId,
  validateResourceExists,
  checkProjectAccess,
  checkHostAccess,
};
