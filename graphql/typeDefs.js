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
        issues: [Issue!]!
    }

    type Issue {
        id: ID!
        title: String!
        description: String
        status: IssueStatus!
        priority: IssuePriority!
        createdAt: Date!
        reporter: User!
        assignees: [User!]!
        project: Project!
    }

    input IssueInput {
        title: String!
        description: String
        priority: IssuePriority!
    }

    input UpdateIssueInput {
        title: String
        description: String
        status: IssueStatus
        priority: IssuePriority
    }

    enum IssueStatus {
        OPEN
        IN_PROGRESS
        RESOLVED
        CLOSED
    }

    enum IssuePriority {
        LOW
        MEDIUM
        HIGH
        CRITICAL
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
        issues(projectId: ID!): [Issue!]!
        issue(id: ID!): Issue
    }

    type Mutation {
        signup(input: SignupInput!): AuthPayload
        login(input: LoginInput!): AuthPayload
        createProject(input: ProjectInput): Project
        addProjectMember(projectId: ID!, userId: ID!): Project
        removeProjectMember(projectId: ID!, userId: ID!): Project
        updateProject(id: ID!, input: ProjectInput!): Project
        deleteProject(id: ID!): Boolean
        createIssue(projectId: ID!, input: IssueInput!): Issue
        updateIssue(id: ID!, input: UpdateIssueInput!): Issue
        deleteIssue(id: ID!): Boolean
        assignUsersToIssue(issueId: ID!, userIds: [ID!]!): Issue
        removeUserFromIssue(issueId: ID!, userId: ID!): Issue
    }
`;

module.exports = typeDefs;
