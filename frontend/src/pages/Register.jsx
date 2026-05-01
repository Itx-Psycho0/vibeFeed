// ============================================================================
// 📁 FILE: Register.jsx — Registration Page Component
// 📍 LOCATION: frontend/src/pages/Register.jsx
// 📚 TOPIC: Multi-Field Forms, Object State, Dynamic Form Handling
// ============================================================================
//
// 🎯 PURPOSE: Registration form with 4 fields (fullName, username, email, password).
// Uses a SINGLE state object instead of separate useState for each field.
//
// 🧠 SINGLE OBJECT STATE vs MULTIPLE useState:
//   Multiple: const [email, setEmail] = useState(''); const [name, setName] = useState('');
//   Single object: const [formData, setFormData] = useState({ email: '', name: '' });
//   WHY single object: Cleaner with many fields, one handleChange handles ALL inputs
// ============================================================================

import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Auth.css';

const Register = () => {
  // Single state object for ALL form fields (cleaner than 4 separate useState calls)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // ─── Dynamic Change Handler ───────────────────────────────────────────
  // ONE function handles ALL inputs (instead of separate handlers for each field)
  // e.target.name = which field changed ('email', 'username', etc.)
  // e.target.value = the new value
  // [e.target.name]: uses COMPUTED PROPERTY NAME — the key is dynamic
  // ...formData spreads the existing values (keeps other fields unchanged)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Send ALL form data to the register endpoint
      const res = await api.post('/auth/register', formData);
      // Auto-login after successful registration (same as Login page)
      login(res.data.data.user, res.data.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container flex-center animate-fade-in">
      <div className="auth-card card glass-panel">
        <div className="auth-header">
          <h2>Join VibeFeed</h2>
          <p>Create an account to start sharing</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="fullName"          // 'name' attribute matches the state key
              className="input-field" 
              value={formData.fullName}  // Controlled by state
              onChange={handleChange}    // Same handler for all fields!
              required 
              placeholder="John Doe"
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username"
              className="input-field" 
              value={formData.username}
              onChange={handleChange}
              required 
              placeholder="johndoe123"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              className="input-field" 
              value={formData.email}
              onChange={handleChange}
              required 
              placeholder="john@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="input-field" 
              value={formData.password}
              onChange={handleChange}
              required 
              placeholder="At least 6 characters"
            />
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
