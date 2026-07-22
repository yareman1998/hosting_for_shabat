import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles, userRole, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: '#666' }}>טוען נתונים...</div>
      </div>
    );
  }
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
