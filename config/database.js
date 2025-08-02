const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { verifyToken } = require("../utils/auth");
const User = require("../models/User");
// typeDefs
const typeDefs = require("../graphql/typeDefs");
// resolvers
const resolvers = require("../graphql/resolvers/index");

function startServer() {
  const DBEntry = process.env.MONGODB_URI;
  const PORT = process.env.PORT || 4000;
  mongoose
    .connect(DBEntry)
    .then(() => {
      console.log("MongoDB Connection Successful");

      const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true,
      });

      startStandaloneServer(server, {
        listen: { port: Number(PORT) },
        // context for auth
        context: async ({ req }) => {
          const authHeader = req?.headers?.authorization || "";

          const token = authHeader.split(" ")[1];

          if (!token || token.trim().length < 10) return { user: null };
          try {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.id);
            return { user };
          } catch (err) {
            console.warn("Token error: ", err.message);
            return { user: null };
          }
        },
      }).then(({ url }) => {
        console.log(`Server is ready at ${url}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection failed", err);
    });
}

module.exports = { startServer };
