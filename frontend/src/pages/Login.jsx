// ============================================================================
// 📁 FILE: Login.jsx — Login Page Component
// 📍 LOCATION: frontend/src/pages/Login.jsx
// 📚 TOPIC: Forms in React, Controlled Components, API Integration, Navigation
// ============================================================================
//
// 🎯 PURPOSE: Login form that authenticates users via the backend API.
// On success, stores the JWT token and redirects to the home page.
//
// 🧠 CONTROLLED COMPONENTS:
// In React, form inputs are "controlled" — React state manages their values.
// Every keystroke updates state (via onChange), and the input displays state (via value).
// This gives React full control over the form data.
//
// 🔮 FUTURE: Social login (Google/GitHub), forgot password, remember me,
//           form validation library (Formik, React Hook Form), password visibility toggle
// ============================================================================

// useState: For form field values, error messages, loading state
// useContext: To access the login function from AuthContext
import { useState, useContext } from 'react';

// Link: Client-side navigation (no page reload)
// useNavigate: Programmatic navigation (redirect after login)
import { Link, useNavigate } from 'react-router-dom';

// AuthContext provides the login() function
import { AuthContext } from '../context/AuthContext';

// Pre-configured Axios instance
import api from '../utils/api';

// Auth page styles (shared with Register page)
import './Auth.css';

const Login = () => {
  // ─── State Variables ────────────────────────────────────────────────────
  // Each form input has its own state variable (controlled component pattern)
  const [email, setEmail] = useState('');       // Email input value
  const [password, setPassword] = useState(''); // Password input value
  const [error, setError] = useState('');        // Error message to display
  const [loading, setLoading] = useState(false); // Prevents double-submit
  
  // Get the login function from AuthContext (saves user + token)
  const { login } = useContext(AuthContext);

  // useNavigate returns a function for programmatic navigation
  // navigate('/') redirects to the home page without a full page reload
  const navigate = useNavigate();

  // ─── Form Submit Handler ──────────────────────────────────────────────
  // Called when the form is submitted (button click or Enter key)
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent default form submission (which reloads the page)
    setError('');        // Clear previous errors
    setLoading(true);    // Show loading state on button
    try {
      // POST /api/v1/auth/login with email and password
      const res = await api.post('/auth/login', { email, password });

      // On success: save user data and token via AuthContext's login function
      // res.data.data.user = user object, res.data.data.token = JWT token
      login(res.data.data.user, res.data.data.token);

      // Redirect to home page
      navigate('/');
    } catch (err) {
      // Show error message from the server, or a generic fallback
      // err.response?.data?.message uses optional chaining for safety
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);  // Re-enable submit button
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="auth-container flex-center animate-fade-in">
      <div className="auth-card card glass-panel">
        <div className="auth-header">
          <h2>Welcome back to VibeFeed</h2>
          <p>Login to continue your vibe</p>
        </div>
        
        {/* Show error message if exists */}
        {/* Short-circuit: error && <div> only renders if error is truthy */}
        {error && <div className="auth-error">{error}</div>}
        
        {/* onSubmit fires when form is submitted (Enter key or button click) */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            {/* Controlled input: value comes from state, onChange updates state */}
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}  // Update state on every keystroke
              required         // HTML5 validation — browser prevents empty submission
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password"  // type="password" hides the characters
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="Enter your password"
            />
          </div>
          {/* disabled={loading} prevents double-submit while API call is in progress */}
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          {/* Link navigates without page reload (client-side routing) */}
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
