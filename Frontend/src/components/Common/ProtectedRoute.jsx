import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from './Loading/Loading';

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const userRole = user?.user_type || null;

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
