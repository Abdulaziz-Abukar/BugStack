const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Project = require("../../models/Project");

const projectResolvers = {
  Query: {
    myProjects: async (_, __, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

        const projects = await Project.find({
          $or: [{ host: user._id }, { members: user._id }],
        })
          .populate("host")
          .populate("members");

        return projects;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    project: async (_, { id }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(id))
          throw new GraphQLError("Invalid ID Submitted");

        const project = await Project.findById(id)
          .populate("host")
          .populate("members");

        if (!project) throw new GraphQLError("Project not found");

        if (
          String(project.host.id) !== String(user._id) &&
          !project.members.some(
            (member) => String(member.id) === String(user._id)
          )
        ) {
          throw new GraphQLError("Not authorized to access this project");
        }

        return project;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    searchProjects: async (_, { keyword }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
  },

  Mutation: {
    createProject: async (_, { input: { title, description } }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

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
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    addProjectMember: async (_, { projectId, userId }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

        const projectIdValidation = mongoose.Types.ObjectId.isValid(projectId);
        const userIdValidation = mongoose.Types.ObjectId.isValid(userId);

        if (!projectIdValidation || !userIdValidation) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");

        if (!project) throw new GraphQLError("Project not found");

        if (String(project.host.id) !== String(user._id)) {
          throw new GraphQLError("Not authorized to access this project");
        }

        const newMember = await User.findById(userId);
        if (!newMember) throw new GraphQLError("User not found");

        const alreadyMember = project.members.some(
          (member) => String(member.id) === String(userId)
        );

        if (alreadyMember) {
          throw new GraphQLError("User is already a member of this project");
        }

        project.members.push(newMember);
        await project.save();

        // re-populate updated members list
        await project.populate("members");

        return project;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    removeProjectMember: async (_, { projectId, userId }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

        const projectIdValidation = mongoose.Types.ObjectId.isValid(projectId);
        const userIdValidation = mongoose.Types.ObjectId.isValid(userId);

        if (!projectIdValidation || !userIdValidation) {
          throw new GraphQLError("Invalid ID Submitted");
        }

        const project = await Project.findById(projectId)
          .populate("host")
          .populate("members");
        if (!project) throw new GraphQLError("Project not found");

        if (String(project.host.id) !== String(user._id)) {
          throw new GraphQLError("Not authroized to access this project");
        }

        const removeMember = await User.findById(userId);

        if (!removeMember) throw new GraphQLError("User not found");

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    updateProject: async (
      _,
      { id, input: { title, description } },
      { user }
    ) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");

        if (!mongoose.Types.ObjectId.isValid(id))
          throw new GraphQLError("Invalid ID Submitted");

        const project = await Project.findById(id)
          .populate("host")
          .populate("members");

        if (!project) throw new GraphQLError("Project not found");

        if (String(project.host.id) !== String(user._id)) {
          throw new GraphQLError("Not authorized to access this project");
        }

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
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },

    deleteProject: async (_, { id }, { user }) => {
      try {
        if (!user) throw new GraphQLError("Not authenticated");
        if (!mongoose.Types.ObjectId.isValid(id))
          throw new GraphQLError("Invalid ID Submitted");

        const project = await Project.findById(id)
          .populate("host")
          .populate("members");
        if (!project) throw new GraphQLError("Project not found");
        if (String(project.host.id) !== String(user._id)) {
          throw new GraphQLError("Not authorized to access this project");
        }

        const deletion = await Project.deleteOne({ _id: id });

        return deletion.deletedCount > 0;
      } catch (err) {
        console.error(err.message);
        throw new GraphQLError(err.message || "Something went wrong");
      }
    },
  },
};

module.exports = projectResolvers;
