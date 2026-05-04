const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

// Helper: check membership
const isProjectMember = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  return project.members.some(m => m.user.toString() === userId.toString());
};

const isProjectAdmin = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member?.role === 'admin';
};

// @GET /api/projects/:projectId/tasks
router.get('/:projectId/tasks', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectMember(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
});

// @GET /api/projects/:projectId/tasks/:taskId
router.get('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectMember(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch task.' });
  }
});

// @POST /api/projects/:projectId/tasks
router.post('/:projectId/tasks', [
  body('title').trim().isLength({ min: 2 }).withMessage('Task title must be at least 2 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectMember(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      project: req.params.projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create task.' });
  }
});

// @PUT /api/projects/:projectId/tasks/:taskId
router.put('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectMember(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const { title, description, assignedTo, status, priority, dueDate } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update task.' });
  }
});

// @PATCH /api/projects/:projectId/tasks/:taskId/status
router.patch('/:projectId/tasks/:taskId/status', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectMember(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { status } = req.body;
    const validStatuses = ['todo', 'in-progress', 'done', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, project: req.params.projectId },
      { status },
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update task status.' });
  }
});

// @DELETE /api/projects/:projectId/tasks/:taskId
router.delete('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!isProjectAdmin(project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only project admin can delete tasks.' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
});

module.exports = router;
