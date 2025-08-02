const { GraphQLScalarType, GraphQLError } = require("graphql");

const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Server-managed Date Scalar (ISO 8601)",
  serialize(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new GraphQLError("Invalid Date object provided");
    }
    return date.toISOString();
  },
  parseValue() {
    throw new GraphQLError("Clients cannot provide a value for Date");
  },
  parseLiteral() {
    throw new GraphQLError("Clients cannot provide a literal for Date");
  },
});

module.exports = { Date: DateScalar };
