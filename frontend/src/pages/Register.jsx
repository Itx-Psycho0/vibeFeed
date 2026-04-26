import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Auth.css';

const Register = () => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
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
              name="fullName"
              className="input-field" 
              value={formData.fullName}
              onChange={handleChange}
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
