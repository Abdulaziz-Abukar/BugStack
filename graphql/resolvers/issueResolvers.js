const { GraphQLError } = require("graphql");
const {
  requireAuth,
  handleGraphQLError,
  validateObjectId,
  validateResourceExists,
  checkProjectAccess,
  checkHostAccess,
} = require("../../utils/authHelpers");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Project = require("../../models/Project");
const Issue = require("../../models/Issue");

const issueResolvers = {
  Query: {
    issues: async (_, { projectId }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(projectId, "Project ID");

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");
        validateResourceExists(project, "Project");
        checkProjectAccess(
          project,
          user,
          "Not authorized to access these issues"
        );

        const issues = await Issue.find({ project: projectId })
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        return issues;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
    issue: async (_, { id }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(id, "Issue ID");

        const issue = await Issue.findById(id)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        validateResourceExists(issue, "Issue ID");
        checkProjectAccess(issue, user, "Not authorized to access this issue");

        return issue;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
  },

  Mutation: {
    createIssue: async (
      _,
      { projectId, input: { title, description, priority } },
      { user }
    ) => {
      try {
        requireAuth(user);
        validateObjectId(projectId, "Project ID");

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");
        validateResourceExists(project, "Project");
        checkProjectAccess(
          project,
          user,
          "Not authorized to access this project"
        );

        const newIssue = await Issue.create({
          title: title.trim(),
          description: description?.trim() || "",
          priority,
          reporter: user._id,
          project: projectId,
        });

        const populatedIssue = await Issue.findById(newIssue._id)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });
        return populatedIssue;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
    updateIssue: async (
      _,
      { id, input: { title, description, status, priority } },
      { user }
    ) => {
      try {
        requireAuth(user);
        validateObjectId(id, "Issue ID");
        if (
          title === undefined &&
          description === undefined &&
          status === undefined &&
          priority === undefined
        ) {
          throw new GraphQLError("No fields to update");
        }

        const issue = await Issue.findById(id).populate({
          path: "project",
          populate: { path: "host members" },
        });

        validateResourceExists(issue, "Issue");
        checkProjectAccess(
          issue,
          user,
          "Not authorized to update this project"
        );

        if (title !== undefined) {
          const trimmedTitle = title.trim();
          if (trimmedTitle.length === 0) {
            throw new GraphQLError("Issue title cannot be empty");
          }
          issue.title = trimmedTitle;
        }
        if (description !== undefined) issue.description = description.trim();
        if (status !== undefined) issue.status = status;
        if (priority !== undefined) issue.priority = priority;

        await issue.save();

        const updatedIssue = await Issue.findById(issue._id)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        return updatedIssue;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
    deleteIssue: async (_, { id }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(id, "Issue ID");

        const issue = await Issue.findById(id).populate({
          path: "project",
          populate: { path: "host members" },
        });

        validateResourceExists(issue, "Issue");
        checkProjectAccess(issue, user, "Not authorized to delete this issue");

        return (await Issue.findByIdAndDelete(id)) ? true : false;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    assignUsersToIssue: async (_, { issueId, userIds }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(issueId, "Issue ID");

        for (const userId of userIds) {
          validateObjectId(userId, "User ID");
        }

        const issue = await Issue.findById(issueId)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        validateResourceExists(issue, "Issue ID");
        checkProjectAccess(
          issue.project,
          user,
          "Not authorized to assign users to this issue"
        );

        // fetch all users by their ids
        const usersToAssign = await User.find({ _id: { $in: userIds } });

        // filter out users not part of the project
        const validAssignees = usersToAssign.filter((candidate) => {
          const isMember = issue.project.members.some(
            (member) => String(member._id) === String(candidate._id)
          );
          const isHost =
            String(issue.project.host._id) === String(candidate._id);
          return isMember || isHost;
        });

        validAssignees.forEach((candidate) => {
          const alreadyAssigned = issue.assignees.some(
            (assignee) => String(assignee._id) === String(candidate._id)
          );

          if (!alreadyAssigned) {
            issue.assignees.push(candidate._id);
          }
        });

        await issue.save();

        const populatedIssue = await Issue.findById(issue._id)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        return populatedIssue;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    removeUserFromIssue: async (_, { issueId, userId }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(issueId, "Issue ID");
        validateObjectId(userId, "User ID");

        const issue = await Issue.findById(issueId)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        validateResourceExists(issue, "Issue ID");
        checkProjectAccess(
          issue.project,
          user,
          "Not authorized to access this issue"
        );

        const userAssignee = issue.assignees.find(
          (assignee) => String(assignee._id) === String(userId)
        );
        if (!userAssignee)
          throw new GraphQLError("User not found in assignees");

        issue.assignees = issue.assignees.filter(
          (assignee) => String(assignee._id) !== String(userId)
        );

        await issue.save();

        const populatedIssue = await Issue.findById(issue._id)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });
        return populatedIssue;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
  },
};

module.exports = issueResolvers;
