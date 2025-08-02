const { GraphQLScalarType, Kind, GraphQLError } = require("graphql");
const validator = require("validator");

const Email = new GraphQLScalarType({
  name: "Email",
  description: "A custom Email scalar that validates email format.",
  serialize(value) {
    return value; // for sending to clients
  },
  parseValue(value) {
    if (!validator.isEmail(value)) {
      throw new GraphQLError("Invalid email format");
    }

    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING || !validator.isEmail(ast.value)) {
      throw new GraphQLError("Invalid email format");
    }
    return ast.value;
  },
});

module.exports = { Email };
