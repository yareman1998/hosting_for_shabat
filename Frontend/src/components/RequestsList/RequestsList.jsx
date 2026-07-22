import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBadgeCount } from '../../store/requestsSlice';
import RequestCard from './RequestCard';
import { postsApi } from '../../api/api';
import './RequestsList.css';

export default function RequestsList({ userRole }) {
  const dispatch = useDispatch();
  const { posts, loading, error, isMockData } = useSelector((state) => state.requests);
  const [localPosts, setLocalPosts] = useState([]);

  // Sync WebSocket posts to local state for client-side interactivity
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  // Determine user role from props or fallback to localStorage user details
  const getRole = () => {
    if (userRole) return userRole;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser).user_type;
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
    return 'guest';
  };

  const currentRole = getRole();

  const getGuestProfileId = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        return userObj.guest_profile?.id;
      }
    } catch (e) {}
    return null;
  };

  const currentGuestProfileId = getGuestProfileId() || '85bc8d8f-0527-4ef0-9779-d0d812e1a30d';

  // Filter posts so a guest only sees their own posts, while hosts see all fetched posts
  const displayedPosts = localPosts.filter(post => {
    if (currentRole === 'guest') {
      return post.guest_profile_id === currentGuestProfileId;
    }
    return true;
  });

  const handleAction = async (post) => {
    if (isMockData) {
      if (currentRole === 'host') {
        // Simulate claim locally
        setLocalPosts(prev =>
          prev.map(p => (p.id === post.id ? { ...p, status: 'matched' } : p))
        );
        alert('סימולציה: הבקשה נתפסה בהצלחה! (מצב מוקדאטה)');
      } else {
        alert(`סימולציה: עריכת בקשה עבור פוסט ${post.id}`);
      }
      return;
    }

    // Real API implementation
    if (currentRole === 'host') {
      try {
        await postsApi.claimPost(post.id);
        alert('הבקשה נתפסה בהצלחה!');
        dispatch(fetchBadgeCount(currentRole));
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
      {isMockData && (
        <div style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--badge-bg)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          padding: '6px',
          borderRadius: '8px',
          marginBottom: '10px',
          border: '1px solid rgba(249, 115, 22, 0.2)'
        }}>
          ⚠️ מציג נתוני סימולציה (מוקדאטה) מכיוון שאין נתונים בדאטה בייס או שהשרת לא זמין
        </div>
      )}
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
