import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Clock, AlertCircle, Filter, ExternalLink } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import './TasksPage.css';

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Circle, color: '#6c63ff' },
  'in-progress': { label: 'In Progress', icon: Clock, color: '#ffa502' },
  done: { label: 'Done', icon: CheckCircle2, color: '#2ed573' },
  blocked: { label: 'Blocked', icon: AlertCircle, color: '#ff4757' },
};

const PRIORITY_COLORS = { low: '#2ed573', medium: '#ffa502', high: '#ff4757' };

const MOCK_MY_TASKS = [
  { _id: 't1', title: 'Implement auth flow', status: 'in-progress', priority: 'high', dueDate: '2024-02-01', project: { _id: '1', name: 'E-Commerce Platform' } },
  { _id: 't2', title: 'Write unit tests', status: 'todo', priority: 'medium', dueDate: null, project: { _id: '2', name: 'Mobile App v2' } },
  { _id: 't3', title: 'Design wireframes', status: 'done', priority: 'low', dueDate: '2024-01-15', project: { _id: '1', name: 'E-Commerce Platform' } },
  { _id: 't4', title: 'Fix login bug', status: 'blocked', priority: 'high', dueDate: '2024-01-20', project: { _id: '3', name: 'Admin Dashboard' } },
];

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // In real app: fetch tasks assigned to current user across all projects
      const res = await fetch('/api/tasks/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data);
    } catch {
      setTasks(MOCK_MY_TASKS);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.updateStatus(task.project._id, task._id, newStatus);
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
      toast.success('Status updated!');
    } catch {
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const overdueTasks = tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'done');

  return (
    <div className="tasks-page fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Tasks</h2>
          <p className="page-sub">{tasks.length} tasks across all projects</p>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="overdue-banner">
          <AlertCircle size={16} />
          <span>{overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''} need your attention</span>
        </div>
      )}

      {/* Status Summary */}
      <div className="status-summary">
        {Object.entries(STATUS_CONFIG).map(([key, { label, color }]) => {
          const count = tasks.filter(t => t.status === key).length;
          return (
            <button
              key={key}
              className={`summary-pill ${filter === key ? 'active' : ''}`}
              style={{ '--pill-color': color }}
              onClick={() => setFilter(filter === key ? 'all' : key)}
            >
              <span className="pill-dot" style={{ background: color }} />
              {label}
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
        {filter !== 'all' && (
          <button className="clear-filter" onClick={() => setFilter('all')}>
            <Filter size={12} /> Clear
          </button>
        )}
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="task-cards">
          {[1,2,3,4].map(i => <div key={i} className="task-card skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <CheckCircle2 size={36} />
          <p>{filter !== 'all' ? `No ${STATUS_CONFIG[filter]?.label} tasks` : 'No tasks assigned to you'}</p>
        </div>
      ) : (
        <div className="task-cards">
          {filtered.map((task, i) => {
            const { icon: Icon, color } = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
            const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
            return (
              <div key={task._id} className="task-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="task-card-left">
                  <button
                    className="status-circle"
                    style={{ color, borderColor: color }}
                    onClick={() => {
                      const statuses = ['todo', 'in-progress', 'done', 'blocked'];
                      const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
                      handleStatusChange(task, next);
                    }}
                    title="Click to cycle status"
                  >
                    <Icon size={18} />
                  </button>
                </div>
                <div className="task-card-body">
                  <h4 className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</h4>
                  <div className="task-meta">
                    <Link to={`/projects/${task.project?._id}`} className="project-link">
                      {task.project?.name} <ExternalLink size={10} />
                    </Link>
                    <span className="priority-dot" style={{ background: PRIORITY_COLORS[task.priority] }} title={task.priority} />
                    <span className="priority-text" style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                  </div>
                </div>
                <div className="task-card-right">
                  {task.dueDate && (
                    <span className="due-date" style={{ color: isOverdue ? 'var(--danger)' : 'var(--text3)' }}>
                      {isOverdue ? '⚠ ' : '📅 '}
                      {format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  <select
                    className="status-select-mini"
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
