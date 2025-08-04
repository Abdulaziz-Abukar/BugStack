const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Project = require("../../models/Project");
const Issue = require("../../models/Issue");

const issueResolvers = {
  Query: {
    issues: async (_, { projectId }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");
        if (!project) throw new GraphQLError("Project not found");
        if (
          String(project.host.id) !== String(user._id) &&
          !project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError("Not authorized to access these issues");
        }

        const issues = await Issue.find({ project: projectId })
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        return issues;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
    issue: async (_, { id }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const issue = await Issue.findById(id)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        if (!issue) throw new GraphQLError("Issue not found");

        if (
          String(issue.project.host.id) !== String(user._id) &&
          !issue.project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError("Not authorized to access this issue");
        }

        return issue;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
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
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");

        if (!project) throw new GraphQLError("Project not found");
        if (
          String(project.host.id) !== String(user._id) &&
          !project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError(
            "Not authorized to create an issue for this project"
          );
        }

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
    updateIssue: async (
      _,
      { id, input: { title, description, status, priority } },
      { user }
    ) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new GraphQLError("Invalid ID Submitted");
        }
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

        if (!issue) throw new GraphQLError("Issue not found");
        if (
          String(issue.project.host.id) !== String(user._id) &&
          !issue.project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError("Not authorized to update this issue");
        }

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
    deleteIssue: async (_, { id }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const issue = await Issue.findById(id).populate({
          path: "project",
          populate: { path: "host members" },
        });
        if (!issue) throw new GraphQLError("Issue not found");
        if (
          String(issue.project.host.id) !== String(user._id) &&
          !issue.project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError("Not authorized to delete this issue");
        }

        return (await Issue.findByIdAndDelete(id)) ? true : false;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    assignUsersToIssue: async (_, { issueId, userIds }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

        const issueIDValidation = mongoose.Types.ObjectId.isValid(issueId);
        if (!issueIDValidation) throw new GraphQLError("Invalid ID Submitted");

        for (const userId of userIds) {
          if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new GraphQLError("Invalid UserID Submitted");
          }
        }

        const issue = await Issue.findById(issueId)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        if (!issue) throw new GraphQLError("Issue not found");

        if (
          String(issue.project.host.id) !== String(user._id) &&
          !issue.project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError(
            "Not authorized to assign users to this issue"
          );
        }

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    removeUserFromIssue: async (_, { issueId, userId }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        const issueValidation = mongoose.Types.ObjectId.isValid(issueId);
        const userValidation = mongoose.Types.ObjectId.isValid(userId);

        if (!issueValidation || !userValidation) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const issue = await Issue.findById(issueId)
          .populate("reporter")
          .populate("assignees")
          .populate({
            path: "project",
            populate: { path: "host members" },
          });

        if (!issue) throw new GraphQLError("Issue not found");
        if (
          String(issue.project.host.id) !== String(user._id) &&
          !issue.project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError("Not authorized to access this issue");
        }

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
  },
};

module.exports = issueResolvers;
