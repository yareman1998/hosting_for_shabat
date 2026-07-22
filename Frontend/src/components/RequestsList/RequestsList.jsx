import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import RequestCard from './RequestCard';
import { postsApi } from '../../api/api';
import './RequestsList.css';

export default function RequestsList() {
  const { posts, loading, error } = useSelector((state) => state.requests);
  const user = useSelector((state) => state.auth.user);
  
  const currentRole = user?.user_type;
  const currentGuestProfileId = user?.profile?.id;
  
  const [localPosts, setLocalPosts] = useState([]);

  // Sync WebSocket posts to local state for client-side interactivity
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  // Filter posts so a guest only sees their own posts, while hosts see all fetched posts
  const displayedPosts = localPosts.filter(post => {
    if (currentRole === 'guest') {
      return post.guest_profile_id === currentGuestProfileId;
    }
    return true;
  });

  const handleAction = async (post) => {
    // Real API implementation
    if (currentRole === 'host') {
      try {
        await postsApi.claimPost(post.id);
        alert('הבקשה נתפסה בהצלחה!');
      } catch (err) {
        console.error('Failed to claim post:', err);
        alert('שגיאה באישור הבקשה: ' + (err.response?.data?.detail || err.message));
      }
    } else {
      // Guest action placeholder
      alert(`עריכת בקשה עבור פוסט ${post.id}`);
    }
  };

  if (loading && displayedPosts.length === 0) {
    return (
      <div className="loading-container">
        <p>טוען בקשות אירוח...</p>
      </div>
    );
  }

  if (error && displayedPosts.length === 0) {
    return (
      <div className="empty-state">
        <p>{error}</p>
      </div>
    );
  }

  if (displayedPosts.length === 0) {
    return (
      <div className="empty-state">
        <p>אין בקשות פעילות כרגע.</p>
      </div>
    );
  }

  return (
    <div className="requests-list-container">
      {displayedPosts.map((post) => (
        <RequestCard
          key={post.id}
          post={post}
          userRole={currentRole}
          onAction={handleAction}
        />
      ))}
    </div>
  );
}
