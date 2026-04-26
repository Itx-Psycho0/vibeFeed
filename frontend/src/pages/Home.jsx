import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import api from '../utils/api';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/posts');
        setPosts(res.data.data);
      } catch (err) {
        console.error('Failed to fetch feed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="home-container animate-fade-in">
      <div className="feed-header">
        <h1>Your Feed</h1>
      </div>
      
      <div className="posts-container">
        {loading ? (
          <div className="flex-center" style={{ height: '200px' }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">No posts yet. Start following people!</div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="post-card card glass-panel">
              <div className="post-header">
                <div className="user-info">
                  <div className="avatar">
                    {post.author.profilePicture ? (
                      <img src={post.author.profilePicture} alt="avatar" />
                    ) : (
                      <div className="avatar-placeholder">{post.author.username.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-details">
                    <h4>{post.author.fullName}</h4>
                    <span>@{post.author.username}</span>
                  </div>
                </div>
              </div>
              
              <div className="post-content">
                {post.media && post.media.length > 0 && (
                  <div className="post-media">
                    <img src={post.media[0].url} alt="Post content" />
                  </div>
                )}
                <p className="post-caption">{post.caption}</p>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="post-hashtags">
                    {post.hashtags.map((tag, idx) => (
                      <span key={idx} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="post-actions">
                <button className="action-btn">
                  <Heart size={20} />
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
