const typeDefs = `#graphql
    scalar Date
    scalar Email

    type User {
        id: ID!
        firstName: String!
        lastName: String!
        email: Email!
        password: String!
        createdAt: Date!
        projects: [Project!]!
    }

    type Project {
        id: ID!
        title: String!
        description: String
        createdAt: Date!
        host: User!
        members: [User]!
    }

    input ProjectInput {
        title: String!
        description: String
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
        myProjects: [Project!]!
        project(id: ID!): Project
        searchProjects(keyword: String): [Project!]!
    }

    type Mutation {
        signup(input: SignupInput!): AuthPayload
        login(input: LoginInput!): AuthPayload
        createProject(input: ProjectInput): Project
        addProjectMember(projectId: ID!, userId: ID!): Project
        removeProjectMember(projectId: ID!, userId: ID!): Project
        updateProject(id: ID!, input: ProjectInput!): Project
        deleteProject(id: ID!): Boolean
    } 
`;

module.exports = typeDefs;
