import { Navigate } from 'react-router-dom';
import Loading from './Loading/Loading';

export default function ProtectedRoute({ children, allowedRoles, userRole, loading }) {
  if (loading) {
    return <Loading />;
  }
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
