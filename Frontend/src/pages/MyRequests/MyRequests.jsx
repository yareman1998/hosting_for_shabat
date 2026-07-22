import './MyRequests.css';
import RequestsList from '../../components/RequestsList/RequestsList';

export default function MyRequests() {
  return (
    <div className="my-requests-page">
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>לוח הבקשות שלי</h1>
      <RequestsList userRole="guest" />
    </div>
  );
}


