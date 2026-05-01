// ============================================================================
// 📁 FILE: Profile.jsx — User Profile Page
// 📚 TOPIC: URL Parameters (useParams), Dynamic Data Fetching, Profile Display
// ============================================================================
// 🎯 PURPOSE: Displays a user's profile — avatar, name, bio, stats (posts/followers/following).
// Uses URL parameter (:id) to fetch the specific user's profile from the API.
// 🔮 FUTURE: Edit profile, user's posts grid, follow button, profile tabs
// ============================================================================

// useEffect: Fetch profile data when component mounts or ID changes
// useState: Store profile data and loading state
import React, { useEffect, useState } from 'react';

// useParams: Extracts URL parameters (the :id from /profile/:id)
import { useParams } from 'react-router-dom';

import api from '../utils/api';

const Profile = () => {
  // useParams() returns an object of URL parameters
  // For route "/profile/:id" visiting "/profile/abc123" → { id: "abc123" }
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile when component mounts OR when 'id' changes
  // [id] dependency: re-fetches if the user navigates to a different profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}`);  // Template literal with dynamic ID
        setProfile(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);  // Re-run when 'id' changes (navigating between profiles)

  // Early returns for loading and error states
  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: '2rem' }}>Profile not found</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="card glass-panel" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {/* Profile Avatar */}
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff' }}>
          {profile.profilePicture ? <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : profile.username.charAt(0).toUpperCase()}
        </div>
        {/* Profile Info */}
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{profile.fullName}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>@{profile.username}</p>
          <p style={{ marginTop: '1rem' }}>{profile.bio || 'No bio yet.'}</p>
          
          {/* Stats: Posts, Followers, Following */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: '#fff' }}>{profile.postsCount || 0}</strong> Posts</span>
            <span><strong style={{ color: '#fff' }}>{profile.followersCount || 0}</strong> Followers</span>
            <span><strong style={{ color: '#fff' }}>{profile.followingCount || 0}</strong> Following</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
