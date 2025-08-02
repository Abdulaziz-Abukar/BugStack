const typeDefs = `#graphql
    scalar Date
    scalar Email

    type User {
        id: ID!
        firstName: String!
        lastName: String!
        email: Email!
        password: String!
        createdAt: Date
    }

    input SignupInput {
        firstName: String!
        lastName: String!
        email: Email!
        password: String!
    }

    input LoginInput {
        email: Email!
        password: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        me: User
    }

    type Mutation {
        signup(input: SignupInput!): AuthPayload
        login(input: LoginInput!): AuthPayload
    } 
`;

module.exports = typeDefs;
