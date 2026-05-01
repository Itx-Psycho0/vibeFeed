// ============================================================================
// 📁 FILE: vite.config.js — Vite Build Tool Configuration
// 📍 LOCATION: frontend/vite.config.js
// 📚 TOPIC: Build Tools, Development Server, Hot Module Replacement (HMR)
// ============================================================================
//
// 🎯 PURPOSE: Configures Vite — the build tool that bundles our React app.
// Vite provides: ultra-fast dev server, Hot Module Replacement (HMR),
// and production bundling.
//
// 🧠 WHAT IS VITE?
// Vite is a NEXT-GENERATION build tool (created by Evan You, creator of Vue.js)
// It's much faster than older tools like Webpack or Create React App (CRA)
//   - Dev server starts in <300ms (Webpack takes 10-30 seconds)
//   - HMR updates in <50ms (changes appear instantly without page reload)
//   - Production builds use Rollup for optimized output
//
// 🔀 ALTERNATIVES: Webpack, Parcel, esbuild, Turbopack (Next.js), Create React App (CRA, deprecated)
//
// 🔮 FUTURE: Add proxy config for API calls, add path aliases (@/ for src/),
//           add environment variable configuration, add PWA plugin
// ============================================================================

import { defineConfig } from 'vite'       // Vite's config helper (provides type hints)
import react from '@vitejs/plugin-react'   // Plugin that enables React JSX support + Fast Refresh

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],  // Enable React support (JSX transformation, Fast Refresh/HMR)
  // 🔮 FUTURE CONFIG OPTIONS:
  // server: {
  //   proxy: { '/api': 'http://localhost:8000' }  // Proxy API calls to backend (avoids CORS)
  // },
  // resolve: {
  //   alias: { '@': '/src' }  // Use @/components instead of ../../components
  // }
})
