import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Folder, Trash2, Users, ArrowRight, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import './ProjectsPage.css';

const MOCK_PROJECTS = [
  { _id: '1', name: 'E-Commerce Platform', description: 'Full-stack shopping app rebuild', members: [{name:'Alice'},{name:'Bob'}], createdAt: new Date().toISOString() },
  { _id: '2', name: 'Mobile App v2', description: 'React Native redesign', members: [{name:'Charlie'}], createdAt: new Date().toISOString() },
  { _id: '3', name: 'Admin Dashboard', description: 'Internal analytics tool', members: [{name:'Alice'},{name:'Dave'},{name:'Eve'}], createdAt: new Date().toISOString() },
];

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data);
    } catch {
      setProjects(MOCK_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await projectsAPI.create(form);
      setProjects([res.data, ...projects]);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '' });
    } catch {
      toast.error('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(projects.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="projects-page fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3].map(i => <div key={i} className="project-card skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Folder size={40} />
          <p>{search ? 'No projects match your search' : 'No projects yet'}</p>
          {isAdmin && !search && (
            <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project, i) => (
            <Link
              to={`/projects/${project._id}`}
              key={project._id}
              className="project-card"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="project-card-header">
                <div className="project-icon">
                  <Folder size={18} />
                </div>
                <div className="project-actions">
                  {isAdmin && (
                    <button
                      className="icon-btn danger"
                      onClick={(e) => handleDelete(project._id, e)}
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ArrowRight size={16} className="arrow-icon" />
                </div>
              </div>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-desc">{project.description || 'No description'}</p>
              <div className="project-footer">
                <div className="member-avatars">
                  <Users size={13} />
                  <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="project-date">
                  {format(new Date(project.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="field">
                <label>Project Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mobile App Redesign"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief project description..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-sm" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
