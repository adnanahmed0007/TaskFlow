const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

// @GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Get projects this user belongs to
    const projectQuery = isAdmin
      ? {}
      : { $or: [{ owner: userId }, { 'members.user': userId }] };

    const userProjects = await Project.find(projectQuery).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const taskQuery = isAdmin
      ? {}
      : { project: { $in: projectIds } };

    const now = new Date();

    const [totalProjects, totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Project.countDocuments(isAdmin ? {} : projectQuery),
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'done' }),
      Task.countDocuments({
        ...taskQuery,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }),
    ]);

    // Status breakdown
    const statusBreakdown = await Task.aggregate([
      { $match: isAdmin ? {} : { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = { todo: 0, 'in-progress': 0, done: 0, blocked: 0 };
    statusBreakdown.forEach(({ _id, count }) => {
      if (statusMap[_id] !== undefined) statusMap[_id] = count;
    });

    res.json({
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      statusBreakdown: statusMap,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
});

module.exports = router;
