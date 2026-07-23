import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Newspaper } from 'lucide-react';
import './MyRequests.css';
import RequestsList from '../../components/RequestsList/RequestsList';
import CreatePostModal from '../../components/RequestsList/CreatePostModal';
import { fetchPosts } from '../../store/requestsSlice';

export default function MyRequests() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();

  return (
    <div className="my-requests-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setIsModalOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, rgb(27, 61, 123), rgb(37, 99, 235))',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Newspaper size={16} />
          פרסם בקשה חדשה
        </button>
      </div>
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => dispatch(fetchPosts())}
      />

      <RequestsList userRole="guest" />
    </div>
  );
}
