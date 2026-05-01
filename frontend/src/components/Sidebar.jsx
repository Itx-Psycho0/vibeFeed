// ============================================================================
// 📁 FILE: Sidebar.jsx — Navigation Sidebar Component
// 📍 LOCATION: frontend/src/components/Sidebar.jsx
// 📚 TOPIC: React Components, NavLink (active route), Icon Libraries, Responsive Design
// ============================================================================
//
// 🎯 PURPOSE: The main navigation bar — appears on the left side on desktop,
// bottom bar on mobile. Shows links to all main pages + logout button.
//
// 🧠 KEY CONCEPTS:
// - NavLink (from react-router-dom): Like <Link> but knows if the current route matches
//   → Adds 'active' class automatically for styling the current page
// - lucide-react: Modern icon library (lightweight alternative to Font Awesome)
// - Responsive design: Desktop = sidebar, Mobile = bottom tab bar
//
// 🔮 FUTURE: Add notification badge count, unread message count, user avatar in sidebar
// ============================================================================

// useContext: Reads global state (AuthContext) for user data and logout function
import { useContext } from 'react';

// NavLink: A special Link that knows if it's the "active" route
// It receives ({ isActive }) in its className prop
import { NavLink } from 'react-router-dom';

// AuthContext provides user data and logout function
import { AuthContext } from '../context/AuthContext';

// Lucide icons — lightweight, customizable SVG icons
// Each icon is imported individually (tree-shaking removes unused icons)
// TOPIC: Tree-Shaking — Build tools remove unused imports to reduce bundle size
import { Home, Compass, Bell, MessageCircle, User, LogOut } from 'lucide-react';

// Component-specific styles
import './Sidebar.css';

// ─── Sidebar Component ──────────────────────────────────────────────────────
const Sidebar = () => {
  // Destructure logout function and user data from AuthContext
  const { logout, user } = useContext(AuthContext);

  // Navigation items defined as an array of objects
  // This makes it easy to add/remove nav items without changing JSX
  // TOPIC: Data-Driven UI — Defining UI structure with data, then mapping to components
  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'Explore', path: '/explore', icon: <Compass size={24} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={24} /> },
    { name: 'Messages', path: '/messages', icon: <MessageCircle size={24} /> },
    // Dynamic path using user's ID — links to their own profile
    // user?._id uses optional chaining (?.) — safe access even if user is null
    { name: 'Profile', path: `/profile/${user?._id}`, icon: <User size={24} /> },
  ];

  return (
    // 'glass-panel' class adds the glassmorphism effect (blur + transparency)
    <aside className="sidebar glass-panel">
      {/* Logo section */}
      <div className="sidebar-logo">
        <h2>VibeFeed</h2>
      </div>

      {/* Navigation links */}
      <nav className="sidebar-nav">
        <ul>
          {/* .map() iterates over navItems and creates a NavLink for each */}
          {/* TOPIC: Array.map() — Transforming an array into JSX elements */}
          {navItems.map((item) => (
            // 'key' is required when rendering lists — React uses it to track items
            <li key={item.name}>
              {/* NavLink — className receives a function with { isActive } */}
              {/* If the current URL matches the path, isActive is true */}
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                {item.icon}
                <span className="nav-label">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout button */}
      <div className="sidebar-footer">
        {/* onClick calls the logout function from AuthContext */}
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={24} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
