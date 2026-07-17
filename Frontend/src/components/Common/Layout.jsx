import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './navbar';

export default function Layout({ userRole }) {
  // Guard clause: If there's no user logged in, send them to the login page immediately
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      {/* The Navbar stays fixed at the top */}
      <Navbar userRole={userRole} />
      
      {/* Whichever child page is active gets rendered right here */}
      <main style={{ padding: '40px', direction: 'rtl' }}>
        <Outlet />
      </main>
    </div>
  );
}