// ============================================================================
// 📁 FILE: main.jsx — React Application Entry Point
// 📍 LOCATION: frontend/src/main.jsx
// 📚 TOPIC: React Rendering, Context Providers, StrictMode
// 🏗️ BUILD ORDER: Frontend Step 1 — This is the FIRST React code that runs
// ============================================================================
//
// 🎯 PURPOSE:
// This file initializes React and renders the App component into the DOM.
// It's the bridge between the HTML (index.html) and React (App.jsx).
//
// 🧠 RENDER PIPELINE:
// index.html → main.jsx → <App /> → Pages (Home, Login, etc.)
//
// 🧠 WHAT HAPPENS HERE:
// 1. Import React and ReactDOM
// 2. Import our App component and global styles
// 3. Find the <div id="root"> in index.html
// 4. Create a React root and render our app inside it
// ============================================================================

// React — the core library for building UI components
import React from 'react';

// ReactDOM — the library that connects React to the browser's DOM
// 'react-dom/client' is the new API (React 18+) — uses createRoot instead of render
import ReactDOM from 'react-dom/client';

// Our main App component (the root of our component tree)
import App from './App.jsx';

// Global CSS styles (applied to the entire app)
// This import has no variable — it just includes the CSS file
import './index.css';

// AuthProvider wraps the app to provide authentication state everywhere
// Any component can access user data, login/logout functions via useContext
import { AuthProvider } from './context/AuthContext.jsx';

// ─── Create React Root and Render ───────────────────────────────────────────
// document.getElementById('root') finds the <div id="root"> in index.html
// createRoot() creates a React root — the entry point for the React component tree
// .render() tells React what to display inside that root
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode is a development tool that:
  //   - Renders components twice to detect side effects
  //   - Warns about deprecated APIs
  //   - Helps find bugs early
  //   - Has NO effect in production builds
  // TOPIC: React StrictMode — Development helper for catching common mistakes
  <React.StrictMode>
    {/* AuthProvider wraps the ENTIRE app so authentication state is global */}
    {/* Any child component can do: const { user } = useContext(AuthContext) */}
    {/* TOPIC: Context Providers — Making data available to all child components */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
