
import HostCard from '../HostCard/HostCard';
import EmptyResultsState from './EmptyResultsState';

export default function HostsGrid({
  hosts,
  loading,
  error,
  onRetry,
  onBookingRequest,
  onResetFilters
}) {
  if (error) {
    return (
      <div
        className="alert alert-danger"
        style={{
          marginBottom: '1.5rem',
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid #fecaca'
        }}
      >
        <span>{error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginRight: '1rem',
              background: 'none',
              border: 'underline',
              color: '#dc2626',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            נסה שנית
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <p>טוען מארחים מתוך בסיס הנתונים...</p>
      </div>
    );
  }

  if (!hosts || hosts.length === 0) {
    return <EmptyResultsState onResetFilters={onResetFilters} />;
  }

  return (
    <main className="hosts-grid-container">
      {hosts.map((host) => (
        <HostCard
          key={host.id}
          host={host}
          onBookingRequest={onBookingRequest}
        />
      ))}
    </main>
  );
}
