import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles, userRole }) {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
