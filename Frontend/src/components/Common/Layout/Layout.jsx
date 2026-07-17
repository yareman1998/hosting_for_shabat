import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import './Layout.css';

export default function Layout({ userRole }) {
  // Guard clause: If there's no user logged in, send them to the login page immediately
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
