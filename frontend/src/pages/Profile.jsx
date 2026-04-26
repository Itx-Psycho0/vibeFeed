import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: '2rem' }}>Profile not found</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="card glass-panel" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff' }}>
          {profile.profilePicture ? <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : profile.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{profile.fullName}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>@{profile.username}</p>
          <p style={{ marginTop: '1rem' }}>{profile.bio || 'No bio yet.'}</p>
          
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
