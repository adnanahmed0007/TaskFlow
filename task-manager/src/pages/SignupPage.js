import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import './Auth.css';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authAPI.signup(form);
      login(res.data.user, res.data.token);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
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
        <p className="auth-subtitle">Create your workspace account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Full Name</label>
            <div className="input-wrap">
              <User size={15} className="input-icon" />
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <div className="input-wrap">
              <Mail size={15} className="input-icon" />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
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
                placeholder="Min. 6 characters"
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Role</label>
            <div className="input-wrap">
              <Shield size={15} className="input-icon" />
              <select name="role" value={form.role} onChange={handleChange} style={{ paddingLeft: '36px' }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
