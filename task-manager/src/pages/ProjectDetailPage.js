import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, ArrowLeft, Users, X, Trash2, Edit2,
  CheckCircle2, Clock, AlertCircle, Circle, UserPlus
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import './ProjectDetailPage.css';

const STATUSES = [
  { key: 'todo', label: 'To Do', icon: Circle, color: '#6c63ff' },
  { key: 'in-progress', label: 'In Progress', icon: Clock, color: '#ffa502' },
  { key: 'done', label: 'Done', icon: CheckCircle2, color: '#2ed573' },
  { key: 'blocked', label: 'Blocked', icon: AlertCircle, color: '#ff4757' },
];

const PRIORITY_COLORS = { low: '#2ed573', medium: '#ffa502', high: '#ff4757' };

const MOCK_TASKS = [
  { _id: 't1', title: 'Setup project repo', status: 'done', priority: 'high', dueDate: '2024-01-10', assignedTo: { name: 'Alice' } },
  { _id: 't2', title: 'Design wireframes', status: 'in-progress', priority: 'medium', dueDate: null, assignedTo: { name: 'Bob' } },
  { _id: 't3', title: 'Implement auth flow', status: 'todo', priority: 'high', dueDate: '2024-02-01', assignedTo: null },
  { _id: 't4', title: 'Write unit tests', status: 'blocked', priority: 'low', dueDate: null, assignedTo: { name: 'Charlie' } },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(null);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [projRes, taskRes, usersRes] = await Promise.allSettled([
        projectsAPI.getOne(id),
        tasksAPI.getAll(id),
        usersAPI.getAll(),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data);
      if (taskRes.status === 'fulfilled') setTasks(taskRes.value.data);
      else setTasks(MOCK_TASKS);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
    } catch {
      setTasks(MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  };

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo?._id || '',
    });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...taskForm, assignedTo: taskForm.assignedTo || null };
      if (editTask) {
        const res = await tasksAPI.update(id, editTask._id, payload);
        setTasks(tasks.map(t => t._id === editTask._id ? res.data : t));
        toast.success('Task updated!');
      } else {
        const res = await tasksAPI.create(id, payload);
        setTasks([...tasks, res.data]);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
    } catch {
      toast.error('Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id, taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(id, taskId, newStatus);
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Drag & Drop
  const onDragStart = (e, task) => setDragging(task);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, status) => {
    e.preventDefault();
    if (dragging && dragging.status !== status) {
      handleStatusChange(dragging._id, status);
      setDragging(null);
    }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  if (loading) return <div className="loading-screen">Loading project...</div>;

  return (
    <div className="project-detail fade-in">
      <div className="detail-header">
        <div className="header-left">
          <Link to="/projects" className="back-btn"><ArrowLeft size={16} /> Projects</Link>
          <div>
            <h2 className="page-title">{project?.name || 'Project'}</h2>
            <p className="page-sub">{project?.description || ''}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>Kanban</button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List</button>
          </div>
          {(isAdmin) && (
            <button className="btn-primary-sm" onClick={openCreateTask}><Plus size={15} /> Add Task</button>
          )}
        </div>
      </div>

      {/* Members Strip */}
      <div className="members-strip">
        <Users size={14} />
        <span>Members:</span>
        {project?.members?.map((m, i) => (
          <span key={i} className="member-chip">{m.name || m.email}</span>
        ))}
        {isAdmin && (
          <button className="member-add-btn" onClick={() => setShowMemberModal(true)}>
            <UserPlus size={13} /> Add
          </button>
        )}
      </div>

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {STATUSES.map(({ key, label, icon: Icon, color }) => (
            <div
              key={key}
              className="kanban-col"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, key)}
            >
              <div className="kanban-col-header" style={{ borderTopColor: color }}>
                <div className="col-title">
                  <Icon size={14} style={{ color }} />
                  <span>{label}</span>
                </div>
                <span className="col-count">{tasksByStatus(key).length}</span>
              </div>
              <div className="kanban-cards">
                {tasksByStatus(key).map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={() => openEditTask(task)}
                    onDelete={() => handleDeleteTask(task._id)}
                    onDragStart={(e) => onDragStart(e, task)}
                    canEdit={isAdmin || task.assignedTo?._id === user?._id}
                  />
                ))}
                {tasksByStatus(key).length === 0 && (
                  <div className="kanban-empty">Drop tasks here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="task-list">
          <div className="task-list-header">
            <span>Task</span><span>Priority</span><span>Assignee</span><span>Due</span><span>Status</span><span></span>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <Circle size={32} />
              <p>No tasks yet</p>
            </div>
          ) : tasks.map(task => (
            <div className="task-row" key={task._id}>
              <span className="task-row-title">{task.title}</span>
              <span>
                <span className="priority-badge" style={{ color: PRIORITY_COLORS[task.priority] }}>
                  {task.priority}
                </span>
              </span>
              <span className="task-assignee">{task.assignedTo?.name || '—'}</span>
              <span className="task-due" style={{ color: task.dueDate && isPast(parseISO(task.dueDate)) ? 'var(--danger)' : 'var(--text2)' }}>
                {task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : '—'}
              </span>
              <span>
                <select
                  className="status-select"
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </span>
              <span className="row-actions">
                <button className="icon-btn" onClick={() => openEditTask(task)}><Edit2 size={13} /></button>
                <button className="icon-btn danger" onClick={() => handleDeleteTask(task._id)}><Trash2 size={13} /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editTask ? 'Edit Task' : 'Create Task'}</h3>
              <button className="icon-btn" onClick={() => setShowTaskModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleTaskSubmit} className="modal-form">
              <div className="field">
                <label>Title *</label>
                <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus placeholder="Task name" />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Optional details..." />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="field">
                  <label>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Assign To</label>
                <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  {project?.members?.map((m, i) => !users.find(u => u._id === m._id) && (
                    <option key={i} value={m._id || i}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-sm" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onDragStart, canEdit }) {
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'done';
  return (
    <div className="kanban-card" draggable onDragStart={onDragStart}>
      <div className="card-top">
        <span className="card-priority" style={{ background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority] }}>
          {task.priority}
        </span>
        {canEdit && (
          <div className="card-actions">
            <button className="icon-btn" onClick={onEdit}><Edit2 size={12} /></button>
            <button className="icon-btn danger" onClick={onDelete}><Trash2 size={12} /></button>
          </div>
        )}
      </div>
      <p className="card-title">{task.title}</p>
      {task.description && <p className="card-desc">{task.description}</p>}
      <div className="card-footer">
        {task.assignedTo && <span className="card-assignee">{task.assignedTo.name}</span>}
        {task.dueDate && (
          <span className="card-due" style={{ color: isOverdue ? 'var(--danger)' : 'var(--text3)' }}>
            {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

