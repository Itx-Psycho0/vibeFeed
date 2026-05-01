// ============================================================================
// 📁 FILE: Home.jsx — Home Feed Page
// 📍 LOCATION: frontend/src/pages/Home.jsx
// 📚 TOPIC: Data Fetching with useEffect, Conditional Rendering, Component Composition
// ============================================================================
//
// 🎯 PURPOSE: The main feed page — shows posts from users you follow.
// Fetches posts from the API on mount and displays them in a card layout.
//
// 🧠 KEY CONCEPTS:
// - useEffect: Fetch data when component mounts
// - useState: Store posts array and loading state
// - Conditional rendering: Show loading / empty state / posts
// - Component composition: Post card with header, media, actions
//
// 🔮 FUTURE: Infinite scroll, like/comment functionality, share posts,
//           create post form, real-time new post updates via Socket.io
// ============================================================================

// useState: Creates reactive state variables
// useEffect: Runs side effects (API calls) when component mounts or dependencies change
import { useState, useEffect } from 'react';

// Lucide icons for post action buttons (like, comment, share, bookmark)
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

// Our pre-configured Axios instance (auto-adds auth token)
import api from '../utils/api';

// Component-specific styles
import './Home.css';

const Home = () => {
  // ─── State Variables ────────────────────────────────────────────────────
  // posts: Array of post objects from the API
  const [posts, setPosts] = useState([]);

  // loading: Boolean flag to show loading indicator
  const [loading, setLoading] = useState(true);

  // ─── Fetch Posts on Mount ───────────────────────────────────────────────
  // useEffect with [] runs ONCE when the component first renders
  // It fetches the user's feed from the backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // GET /api/v1/posts — returns posts from followed users + own posts
        const res = await api.get('/posts');
        // res.data is the Axios response body
        // res.data.data is our API's 'data' field (contains the posts array)
        setPosts(res.data.data);
      } catch (err) {
        console.error('Failed to fetch feed', err);
      } finally {
        setLoading(false);  // Stop loading regardless of success/failure
      }
    };
    fetchPosts();
  }, []);  // Empty dependency array = run only once on mount

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    // 'animate-fade-in' adds a smooth entrance animation (defined in index.css)
    <div className="home-container animate-fade-in">
      <div className="feed-header">
        <h1>Your Feed</h1>
      </div>
      
      <div className="posts-container">
        {/* Conditional rendering — show different content based on state */}
        {/* TOPIC: Ternary Operator — condition ? trueValue : falseValue */}
        {loading ? (
          // Loading state
          <div className="flex-center" style={{ height: '200px' }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          // Empty state (no posts to show)
          <div className="empty-state">No posts yet. Start following people!</div>
        ) : (
          // Map over posts array and render a card for each post
          posts.map(post => (
            // 'key' is required for lists — React uses it to efficiently update the DOM
            // Using post._id (MongoDB's unique ID) as the key
            <div key={post._id} className="post-card card glass-panel">
              {/* ─── Post Header (Author Info) ─────────────────────────── */}
              <div className="post-header">
                <div className="user-info">
                  <div className="avatar">
                    {/* Show profile picture or a letter placeholder */}
                    {post.author.profilePicture ? (
                      <img src={post.author.profilePicture} alt="avatar" />
                    ) : (
                      // First letter of username as avatar placeholder
                      <div className="avatar-placeholder">{post.author.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-details">
                    <h4>{post.author.fullName}</h4>
                    <span>@{post.author.username}</span>
                  </div>
                </div>
              </div>
              
              {/* ─── Post Content (Media + Caption + Hashtags) ─────────── */}
              <div className="post-content">
                {/* Render media only if it exists and has items */}
                {/* && is short-circuit rendering: if left is false, right is skipped */}
                {post.media && post.media.length > 0 && (
                  <div className="post-media">
                    <img src={post.media[0].url} alt="Post content" />
                  </div>
                )}
                <p className="post-caption">{post.caption}</p>
                {/* Render hashtags if they exist */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="post-hashtags">
                    {post.hashtags.map((tag, idx) => (
                      <span key={idx} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* ─── Post Actions (Like, Comment, Share, Bookmark) ─────── */}
              <div className="post-actions">
                <button className="action-btn">
                  <Heart size={20} />
                  {/* ?. (optional chaining) prevents error if likes is undefined */}
                  {/* || 0 provides a default of 0 if the value is undefined/null */}
                  <span>{post.likes?.length || 0}</span>
                </button>
                <button className="action-btn">
                  <MessageCircle size={20} />
                  <span>{post.comments?.length || 0}</span>
                </button>
                <button className="action-btn">
                  <Share2 size={20} />
                </button>
                <button className="action-btn ml-auto">
                  <Bookmark size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
