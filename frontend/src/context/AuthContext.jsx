// ============================================================================
// 📁 FILE: AuthContext.jsx — Global Authentication State Management
// 📍 LOCATION: frontend/src/context/AuthContext.jsx
// 📚 TOPIC: React Context API, Global State, Token Management
// ============================================================================
//
// 🎯 PURPOSE:
// Manages authentication state GLOBALLY — any component can check if the user
// is logged in, get user data, or call login/logout functions.
//
// 🧠 WHAT IS REACT CONTEXT?
// Context is React's built-in global state management.
// Without Context: You'd pass 'user' prop through every component (prop drilling).
// With Context: Any component anywhere can access 'user' directly.
//
// Provider Pattern:
//   <AuthProvider>          ← Wraps the entire app (in main.jsx)
//     <App />                ← All children can access the context
//       <Home />             ← const { user } = useContext(AuthContext)
//       <Sidebar />          ← const { logout } = useContext(AuthContext)
//
// 🔀 ALTERNATIVES: Redux, Zustand, Jotai, MobX, TanStack Query (for server state)
//
// 🔮 FUTURE: Add token refresh logic, persistent login, profile update in context
// ============================================================================

// createContext: Creates a Context object (the "mailbox" that holds shared data)
// useState: React hook for component-level state
// useEffect: React hook for side effects (API calls, subscriptions, etc.)
import { createContext, useState, useEffect } from 'react';

// Our configured Axios instance (adds auth token to every request automatically)
import api from '../utils/api';

// ─── Create the Context ─────────────────────────────────────────────────────
// createContext() creates a new Context object
// This is exported so components can: import { AuthContext } from '...'
// Then use it with: useContext(AuthContext) to access the values
export const AuthContext = createContext();

// ─── Context Provider Component ─────────────────────────────────────────────
// The Provider component wraps the app and PROVIDES values to all children
// 'children' is whatever JSX is placed between <AuthProvider> tags
export const AuthProvider = ({ children }) => {
  // ─── State Variables ──────────────────────────────────────────────────
  // useState(initialValue) creates a state variable + its setter function
  // [value, setValue] = useState(initial)

  // 'user' holds the logged-in user's data (null = not logged in)
  const [user, setUser] = useState(null);

  // 'loading' is true while we check if the user has a valid token
  // This prevents the login page from flashing before auth check completes
  const [loading, setLoading] = useState(true);

  // ─── Auto-Login on Page Load ──────────────────────────────────────────
  // useEffect runs ONCE when the component mounts ([] = empty dependency array)
  // It checks localStorage for a saved token and validates it with the server
  // TOPIC: useEffect — Running code when a component first renders
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if a token exists in localStorage
        // localStorage persists data across browser sessions (until cleared)
        const token = localStorage.getItem('token');
        if (token) {
          // Validate the token by calling GET /api/v1/auth/me
          // If the token is valid, the server returns the user data
          // The Axios interceptor in api.js automatically adds the token to headers
          const res = await api.get('/auth/me');
          setUser(res.data.data);  // Set user state with the server response
        }
      } catch (err) {
        // If token is invalid/expired, remove it
        // This forces the user to log in again
        localStorage.removeItem('token');
      } finally {
        // 'finally' runs whether try succeeds OR fails
        // Set loading to false so the app can render
        setLoading(false);
      }
    };
    fetchUser();
  }, []);  // Empty array = run only ONCE on mount (not on every re-render)

  // ─── Login Function ───────────────────────────────────────────────────
  // Called by Login/Register pages after successful API call
  // Saves the token to localStorage and sets the user state
  const login = (userData, token) => {
    localStorage.setItem('token', token);  // Persist token across page reloads
    setUser(userData);                     // Update React state
  };

  // ─── Logout Function ──────────────────────────────────────────────────
  // Called by the Sidebar logout button
  // Removes token and clears user state → triggers redirect to /login
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);  // Setting user to null triggers PrivateRoute redirect
  };

  // ─── Provide Values to Children ───────────────────────────────────────
  // The 'value' prop defines what data/functions are available via useContext
  // Any child component can do: const { user, login, logout, loading } = useContext(AuthContext)
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
