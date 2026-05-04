import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, tasksAPI, projectsAPI } from '../api';
import { CheckSquare, FolderKanban, Clock, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import './DashboardPage.css';

const MOCK_STATS = {
  totalProjects: 5,
  totalTasks: 24,
  completedTasks: 14,
  overdueTasks: 3,
};

const STATUS_COLOR = {
  todo: '#6c63ff',
  'in-progress': '#ffa502',
  done: '#2ed573',
  blocked: '#ff4757',
};

const STATUS_LABEL = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(MOCK_STATS);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes] = await Promise.allSettled([dashboardAPI.getStats()]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch {}
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'var(--accent)' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: '#43e97b' },
    { label: 'Completed', value: stats.completedTasks, icon: TrendingUp, color: '#26d0ce' },
    { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'var(--danger)' },
  ];

  const completionPct = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-sub">Here's what's happening across your projects</p>
        </div>
        <Link to="/projects" className="btn-outline">
          View Projects <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div className="stat-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="stat-icon" style={{ background: `${card.color}22`, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{loading ? '—' : card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Progress Panel */}
        <div className="panel">
          <h3 className="panel-title">Overall Progress</h3>
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">Task Completion</span>
              <span className="progress-value">{completionPct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <div className="progress-legend">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <div className="legend-item" key={key}>
                  <span className="legend-dot" style={{ background: STATUS_COLOR[key] }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="panel">
          <h3 className="panel-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/projects" className="quick-action">
              <FolderKanban size={18} />
              <div>
                <p>New Project</p>
                <span>Create a project workspace</span>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/tasks" className="quick-action">
              <CheckSquare size={18} />
              <div>
                <p>My Tasks</p>
                <span>View all assigned tasks</span>
              </div>
              <ArrowRight size={14} />
            </Link>
            <Link to="/projects" className="quick-action warning">
              <Clock size={18} />
              <div>
                <p>Overdue Tasks</p>
                <span>{stats.overdueTasks} tasks need attention</span>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
