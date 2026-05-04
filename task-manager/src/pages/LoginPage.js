import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo login helper
  const demoLogin = async (role) => {
    const creds = role === 'admin'
      ? { email: 'admin@demo.com', password: 'demo1234' }
      : { email: 'member@demo.com', password: 'demo1234' };
    setForm(creds);
    setLoading(true);
    try {
      const res = await authAPI.login(creds);
      login(res.data.user, res.data.token);
      toast.success(`Logged in as ${role}!`);
      navigate('/dashboard');
    } catch {
      toast.error('Demo login failed - backend not connected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-glow glow1" />
        <div className="bg-glow glow2" />
      </div>
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <Zap size={28} />
          <h1>TaskFlow</h1>
        </div>
        <p className="auth-subtitle">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <div className="input-wrap">
              <Mail size={15} className="input-icon" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <Lock size={15} className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="demo-section">
          <p>Try demo accounts:</p>
          <div className="demo-btns">
            <button onClick={() => demoLogin('admin')} className="demo-btn admin">Admin Demo</button>
            <button onClick={() => demoLogin('member')} className="demo-btn member">Member Demo</button>
          </div>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
