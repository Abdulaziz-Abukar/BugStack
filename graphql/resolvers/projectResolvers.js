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

const projectResolvers = {
  Project: {
    issues: async (parent) => {
      return await Issue.find({ project: parent._id })
        .populate("reporter")
        .populate("assignees");
    },
  },
  Query: {
    myProjects: async (_, __, { user }) => {
      try {
        requireAuth(user);

        const projects = await Project.find({
          $or: [{ host: user._id }, { members: user._id }],
        })
          .populate("host")
          .populate("members");

        return projects;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    project: async (_, { id }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(id);

        const project = await Project.findById(id)
          .populate("host")
          .populate("members");

        validateResourceExists(project, "Project");

        checkProjectAccess(
          project,
          user,
          "Not authorized to access this project"
        );

        return project;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    searchProjects: async (_, { keyword }, { user }) => {
      try {
        requireAuth(user);

        const accessFilter = {
          $or: [{ host: user._id }, { members: user._id }],
        };

        const searchFilter = keyword
          ? {
              $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
              ],
            }
          : {};

        const projects = await Project.find({
          ...accessFilter,
          ...searchFilter,
        })
          .populate("host")
          .populate("members");

        return projects;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
  },

  Mutation: {
    createProject: async (_, { input: { title, description } }, { user }) => {
      try {
        requireAuth(user);

        const newProject = await Project.create({
          title: title.trim(),
          description: description?.trim() || "",
          host: user._id,
          members: [],
        });

        // populate host field before returning
        await newProject.populate("host");

        return newProject;
      } catch (err) {
        console.error(err);
        handleGraphQLError(err);
      }
    },

    addProjectMember: async (_, { projectId, userId }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(projectId, "Project ID");
        validateObjectId(userId, "User ID");

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");

        validateResourceExists(project, "Project");
        checkHostAccess(project, user);

        const newMember = await User.findById(userId);
        if (!newMember) throw new GraphQLError("User not found");
        validateResourceExists(newMember, "User");

        const alreadyMember = project.members.some(
          (member) => String(member.id) === String(userId)
        );

        if (alreadyMember) {
          throw new GraphQLError("User is already a member of this project");
        }

        project.members.push(newMember);
        await project.save();

        // re-populate updated members list
        await project.populate("host").populate("members");

        return project;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    removeProjectMember: async (_, { projectId, userId }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(projectId, "Project ID");
        validateObjectId(userId, "User ID");

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");

        validateResourceExists(project, "Project");
        checkHostAccess(project, user);

        const removeMember = await User.findById(userId);
        validateResourceExists(removeMember, "User");

        const wasMember = project.members.some(
          (member) => String(member._id) === String(userId)
        );
        if (!wasMember)
          throw new GraphQLError("User is not a member of this project");

        project.members = project.members.filter(
          (member) => String(member._id) !== String(userId)
        );

        await project.save();

        await project.populate("members");

        return project;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    updateProject: async (
      _,
      { id, input: { title, description } },
      { user }
    ) => {
      try {
        requireAuth(user);
        validateObjectId(id, "Project ID");

        const project = await Project.findById(id)
          .populate("host")
          .populate("members");

        validateResourceExists(project, "Project");
        checkHostAccess(project, user);

        if (title !== undefined) {
          const trimmedTitle = title.trim();
          if (trimmedTitle.length === 0) {
            throw new GraphQLError("Project title cannot be empty");
          }
          project.title = trimmedTitle;
        }
        if (description !== undefined) project.description = description.trim();

        await project.save();

        return project;
      } catch (err) {
        handleGraphQLError(err);
      }
    },

    deleteProject: async (_, { id }, { user }) => {
      try {
        requireAuth(user);
        validateObjectId(id, "Project ID");

        const project = await Project.findById(id)
          .populate("host")
          .populate("members");
        validateResourceExists(project, "Project");
        checkHostAccess(project, user);

        const deletion = await Project.deleteOne({ _id: id });

        return deletion.deletedCount > 0;
      } catch (err) {
        handleGraphQLError(err);
      }
    },
  },
};

module.exports = projectResolvers;
