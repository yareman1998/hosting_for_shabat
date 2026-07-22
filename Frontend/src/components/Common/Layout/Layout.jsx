import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Loading from '../Loading/Loading';
import './Layout.css';

export default function Layout({ userRole, loading }) {
  // If authentication state is still loading, show loading indicator instead of redirecting prematurely
  if (loading) {
    return <Loading />;
  }

  // Guard clause: If auth check completed and there's no user logged in, send them to the login page
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-container">
      {/* The Navbar stays fixed at the top */}
      <header>
        <Navbar userRole={userRole} />
      </header>
      
      {/* Whichever child page is active gets rendered right here */}
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
