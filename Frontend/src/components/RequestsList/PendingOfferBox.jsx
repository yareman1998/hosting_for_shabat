import { useState } from 'react';
import { Heart, Check, X, Loader2 } from 'lucide-react';
import { bookingsApi } from '../../api/api';

export default function PendingOfferBox({ post, onUpdateSuccess }) {
  const [respondingAction, setRespondingAction] = useState(null); // null | 'matched' | 'rejected'

  const handleGuestRespond = async (statusChoice) => {
    if (!post.pending_match_id) {
      console.warn('No pending match id found on post');
      return;
    }
    try {
      setRespondingAction(statusChoice);
      await bookingsApi.respondToBooking(post.pending_match_id, statusChoice);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      console.error('Failed to respond to booking:', err);
      alert('שגיאה בתגובה לבקשה: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRespondingAction(null);
    }
  };

  const isSubmitting = respondingAction !== null;

  return (
    <div className="pending-offer-box" style={{
      backgroundColor: '#f0f7ff',
      border: '1px solid #bfdbfe',
      borderRadius: '12px',
      padding: '14px',
      margin: '12px 0',
      direction: 'rtl'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 600, color: '#1e40af' }}>
        <Heart size={18} color="#ef4444" fill="#ef4444" />
        <span>מארח הציע לארח אותך!</span>
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: '#1e3a8a' }}>
        {post.claimed_by_host_name ? `מארח: ${post.claimed_by_host_name}` : 'מארח מקהילת האפליקציה'}
        {post.claimed_by_host_city ? ` מתגורר ב${post.claimed_by_host_city}` : ''}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => handleGuestRespond('matched')}
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '10px 14px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: isSubmitting && respondingAction !== 'matched' ? 0.6 : 1,
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
          }}
        >
          {respondingAction === 'matched' ? <Loader2 size={16} className="spin-icon" /> : <Check size={16} />}
          <span>סבבה מעולה</span>
        </button>
        <button
          onClick={() => handleGuestRespond('rejected')}
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '10px 14px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: isSubmitting && respondingAction !== 'rejected' ? 0.6 : 1
          }}
        >
          {respondingAction === 'rejected' ? <Loader2 size={16} className="spin-icon" /> : <X size={16} />}
          <span>לא מתאים לי</span>
        </button>
      </div>
    </div>
  );
}
