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
          .populate("assignees");

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
          .populate("project");

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

        await newIssue
          .populate("reporter")
          .populate("assignees")
          .populate("project");

        return newIssue;
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

        const issue = await Issue.findById(id).populate("project");
        if (!issue) throw new GraphQLError("Issue not found");
        if (
          String(issue.project.host.id) !== String(user._id) &&
          !issue.project.members.some(
            (member) => String(member.id) === String(user.id)
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
        await issue
          .populate("reporter")
          .populate("assignees")
          .populate("project");

        return issue;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
  },
};
