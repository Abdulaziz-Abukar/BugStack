const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

function startServer() {
  const DBEntry = process.env.MONGODB_URI;
  const PORT = process.env.PORT || 4000;

  const typeDefs = `#graphql
  type Query {
    _empty: String
  } 
  `;

  const resolvers = {};

  mongoose
    .connect(DBEntry)
    .then(() => {
      console.log("MongoDB Connection Successful");

      const server = new ApolloServer({ typeDefs, resolvers });

      startStandaloneServer(server, {
        listen: { port: Number(PORT) },
        // context for auth
      }).then(({ url }) => {
        console.log(`Server is ready at ${url}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection failed", err);
    });
}

module.exports = { startServer };
