// ============================================================================
// 📁 FILE: App.jsx — Main Application Component (Routing & Layout)
// 📍 LOCATION: frontend/src/App.jsx
// 📚 TOPIC: React Router, Protected Routes, Layout Components, Conditional Rendering
// 🏗️ BUILD ORDER: Frontend Step 2 — Build after main.jsx
// ============================================================================
//
// 🎯 PURPOSE:
// The App component is the ROOT of our React component tree.
// It handles: client-side routing, authentication guards (private routes),
// and the main layout (sidebar + content area).
//
// 🧠 CLIENT-SIDE ROUTING (React Router):
// In an SPA, the browser doesn't reload for each page.
// React Router intercepts URL changes and renders the matching component.
//   /         → Home component
//   /login    → Login component
//   /profile/123 → Profile component (with id=123)
//
// The URL changes but the page NEVER reloads — it's all JavaScript!
//
// 🔀 ALTERNATIVES: Next.js (file-based routing), TanStack Router, Wouter
//
// 🔮 FUTURE: Add error boundaries, 404 page, loading skeletons, route transitions
// ============================================================================

// BrowserRouter provides the routing context (uses browser's History API)
// Routes is a container for all Route definitions
// Route maps a URL path to a component
// Navigate redirects to a different route programmatically
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// useContext reads data from a React Context (global state)
import { useContext } from 'react';

// Import our authentication context (provides user data + login/logout)
import { AuthContext } from './context/AuthContext';

// Import UI components and pages
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// ─── Private Route Component (Authentication Guard) ─────────────────────────
// This component PROTECTS routes — only logged-in users can access them
// If user is not logged in → redirect to /login
// If user IS logged in → render the children (the protected page)
//
// Usage: <PrivateRoute><Home /></PrivateRoute>
// 'children' is a special React prop — it's whatever is between the opening and closing tags
//
// TOPIC: Higher-Order Components / Route Guards — Protecting routes from unauthorized access
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  // Show loading while checking authentication status
  if (loading) return <div>Loading...</div>;
  // If user exists → show the protected content, otherwise → redirect to login
  // Navigate component performs a client-side redirect (no page reload)
  return user ? children : <Navigate to="/login" />;
};

// ─── Main App Component ─────────────────────────────────────────────────────
function App() {
  // Get user and loading state from AuthContext
  const { user, loading } = useContext(AuthContext);

  // Show loading screen while checking if user is authenticated
  // This prevents flash of login page when the user IS actually logged in
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    // Router wraps the entire app to enable client-side routing
    // It provides routing context to all child components
    <Router>
      {/* Main layout container — flexbox with sidebar + content */}
      <div className="app-container">
        {/* Sidebar only shows when user is logged in */}
        {/* {user && <Sidebar />} is a conditional render: if user exists, render Sidebar */}
        {/* This is a common React pattern — short-circuit evaluation */}
        {user && <Sidebar />}

        {/* Main content area — takes remaining space after sidebar */}
        {/* Conditional className: logged-in gets 'main-content', logged-out gets 'flex-center' */}
        <main className={user ? 'main-content' : 'flex-center'} style={{ width: '100%' }}>
          {/* Routes container — only the matching Route renders */}
          <Routes>
            {/* ─── Public Routes (only accessible when NOT logged in) ─────── */}
            {/* If user IS logged in and visits /login, redirect to home */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

            {/* ─── Protected Routes (only accessible when logged in) ─────── */}
            {/* PrivateRoute checks auth before rendering the page component */}
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
            {/* :id is a URL parameter — Profile component reads it with useParams() */}
            <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
