import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  LogOut, Menu, X, Zap, ChevronRight, User
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Zap size={20} />
            {sidebarOpen && <span>TaskFlow</span>}
          </div>
          <button className="toggle-btn desktop-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronRight size={16} className={sidebarOpen ? 'rotated' : ''} />
          </button>
          <button className="toggle-btn mobile-only" onClick={() => setMobileOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              <User size={14} />
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`}>
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-right">
            <span className="greeting">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
