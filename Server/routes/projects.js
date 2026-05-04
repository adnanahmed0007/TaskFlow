const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Helper to check if user is project admin or app admin
const isProjectAdmin = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member?.role === 'admin';
};

// Helper: check if user is a member of project
const isProjectMember = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  return project.members.some(m => m.user.toString() === userId.toString());
};

// @GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ]
    })
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    // Add task counts
    const projectsWithCount = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        const completedCount = await Task.countDocuments({ project: p._id, status: 'done' });
        return { ...p.toJSON(), taskCount, completedCount };
      })
    );

    res.json(projectsWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch projects.' });
  }
});

// @GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectMember(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const taskCount = await Task.countDocuments({ project: project._id });
    const completedCount = await Task.countDocuments({ project: project._id, status: 'done' });

    res.json({ ...project.toJSON(), taskCount, completedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch project.' });
  }
});

// @POST /api/projects
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, description, status } = req.body;

    const project = await Project.create({
      name,
      description,
      status,
      owner: req.user._id,
      members: [],
    });

    await project.populate('owner', 'name email role');
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create project.' });
  }
});

// @PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectAdmin(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only project admin can update.' });
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members.user', 'name email role');

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update project.' });
  }
});

// @DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only project owner can delete.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete project.' });
  }
});

// @POST /api/projects/:id/members — Add member
router.post('/:id/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectAdmin(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only project admin can add members.' });
    }

    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User with this email not found.' });

    // Check if already a member or owner
    if (project.owner.toString() === userToAdd._id.toString()) {
      return res.status(400).json({ message: 'User is the project owner.' });
    }
    const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member.' });

    project.members.push({ user: userToAdd._id, role: role || 'member' });
    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members.user', 'name email role');

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add member.' });
  }
});

// @DELETE /api/projects/:id/members/:userId — Remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectAdmin(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only project admin can remove members.' });
    }

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('owner', 'name email role');
    await project.populate('members.user', 'name email role');

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove member.' });
  }
});

module.exports = router;
