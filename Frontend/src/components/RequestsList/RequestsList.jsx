import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import RequestCard from './RequestCard';
import CreatePostModal from './CreatePostModal';
import { postsApi } from '../../api/api';
import { checkPostUrgency } from '../../utils/date';
import { fetchPosts } from '../../store/requestsSlice';
import './RequestsList.css';


export default function RequestsList({ userRole: userRoleProp }) {
  const dispatch = useDispatch();
  const { posts, loading, error } = useSelector((state) => state.requests);
  const user = useSelector((state) => state.auth.user);

  const currentRole = userRoleProp || user?.user_type;
  const currentGuestProfileId = user?.profile?.id || user?.guest_profile?.id;

  const [localPosts, setLocalPosts] = useState([]);
  const [claimingPostId, setClaimingPostId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(currentRole === 'host' ? 'urgent' : 'all');
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);

  // Sync WebSocket posts to local state and calculate initial tab
  useEffect(() => {
    setLocalPosts(posts);

    if (!hasInitializedFilter && posts.length > 0) {
      if (currentRole === 'host') {
        const hasUrgent = posts.some((post) => {
          const isUnapproved = post.status !== 'matched' && post.status !== 'approved';
          return isUnapproved && checkPostUrgency(post.requested_date).isUrgent;
        });
        setActiveFilter(hasUrgent ? 'urgent' : 'pending');
      } else if (currentRole === 'guest') {
        const hasPendingApproval = posts.some((post) => post.status === 'pending');
        setActiveFilter(hasPendingApproval ? 'pending' : 'all');
      }
      setHasInitializedFilter(true);
    }
  }, [posts, currentRole, hasInitializedFilter]);


  // Filter posts so a guest only sees their own posts, while hosts see all fetched posts
  const displayedPosts = localPosts.filter(post => {
    if (currentRole === 'guest' && currentGuestProfileId && post.guest_profile_id && post.guest_profile_id !== currentGuestProfileId) {
      return false;
    }

    if (activeFilter === 'urgent') {
      const isUnapproved = post.status !== 'matched' && post.status !== 'approved';
      const { isUrgent } = checkPostUrgency(post.requested_date);
      return isUnapproved && isUrgent;
    }
    if (activeFilter === 'pending') {
      return currentRole === 'guest' ? post.status === 'pending' : (post.status === 'open' || post.status === 'pending');
    }
    if (activeFilter === 'open') {
      return post.status === 'open';
    }
    if (activeFilter === 'approved') {
      return post.status === 'matched' || post.status === 'approved';
    }
    if (activeFilter === 'rejected') {
      return post.status === 'rejected' || post.status === 'declined' || post.status === 'cancelled';
    }

    return true;
  }).sort((a, b) => {
    // Priority: Urgent unapproved posts always come first for hosts
    const aUnapproved = a.status !== 'matched' && a.status !== 'approved';
    const bUnapproved = b.status !== 'matched' && b.status !== 'approved';
    const aUrgent = aUnapproved && checkPostUrgency(a.requested_date).isUrgent;
    const bUrgent = bUnapproved && checkPostUrgency(b.requested_date).isUrgent;

    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return 0;
  });


  const [editingPost, setEditingPost] = useState(null);

  const handleAction = async (post) => {
    // Real API implementation
    if (currentRole === 'host') {
      try {
        setClaimingPostId(post.id);
        await postsApi.claimPost(post.id);
        alert('הבקשה נתפסה בהצלחה!');
      } catch (err) {
        console.error('Failed to claim post:', err);
        alert('שגיאה באישור הבקשה: ' + (err.response?.data?.detail || err.message));
      } finally {
        setClaimingPostId(null);
      }
    } else {
      setEditingPost(post);
    }
  };

  const pendingGuestCount = localPosts.filter(p => p.status === 'pending').length;

  const filterTabs = currentRole === 'guest' ? [
    { id: 'pending', label: pendingGuestCount > 0 ? `ממתין לאישורך (${pendingGuestCount})` : 'ממתין לאישורך' },
    { id: 'open', label: 'מחפש מארח' },
    { id: 'all', label: 'הכל' },
    { id: 'approved', label: 'מאושר' },
  ] : [
    { id: 'urgent', label: 'מחכה לאישור דחוף' },
    { id: 'pending', label: 'ממתין' },
    { id: 'all', label: 'הכל' },
    { id: 'approved', label: 'מאושר' },
    { id: 'rejected', label: 'נדחה' },
  ];


  return (
    <div className="requests-list-container">
      <div className="requests-filter-nav">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            className={`requests-filter-btn ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && displayedPosts.length === 0 ? (
        <div className="loading-container">
          <p>טוען בקשות אירוח...</p>
        </div>
      ) : !loading && error && displayedPosts.length === 0 ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="empty-state">
          <p>אין בקשות בקטגוריה זו כרגע.</p>
        </div>
      ) : (
        displayedPosts.map((post) => (
          <RequestCard
            key={post.id}
            post={post}
            userRole={currentRole}
            onAction={handleAction}
            isClaiming={claimingPostId === post.id}
            onUpdateSuccess={() => dispatch(fetchPosts())}
          />
        ))

      )}
    </div>
  );
}

