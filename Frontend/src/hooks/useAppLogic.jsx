import { useState, useEffect, useMemo } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/Common/Layout/Layout'

import Login from '../pages/Login/Login'
import Signup from '../pages/Signup/Signup'
import HomePage from '../pages/Home/Home'
import FindHost from '../pages/FindHost/FindHost'
import MyRequests from '../pages/MyRequests/MyRequests'
import RequestsBoard from '../pages/RequestsBoard/RequestsBoard'
import ProfilePage from '../pages/Profile/Profile'
import NotFound from '../pages/NotFound/NotFound'

// Admin Views
import AdminLayout from '../pages/Admin/AdminLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'
import AdminUsers from '../pages/Admin/AdminUsers'
import AdminBookings from '../pages/Admin/AdminBookings'
import AdminListings from '../pages/Admin/AdminListings'

import ProtectedRoute from '../components/Common/ProtectedRoute'

export function useAppLogic() {
  // Read user role from localStorage, defaulting to null if not logged in
  const [userRole, setUserRole] = useState(() => {
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        return savedUser.user_type || null;
      }
    } catch (e) {
      console.error('Error reading user role from localStorage:', e);
    }
    return null;
  });

  const handleLoginSuccess = () => {
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        setUserRole(savedUser.user_type || null);
      }
    } catch (e) {
      console.error('Error handling login success:', e);
    }
  };

  useEffect(() => {
    const handleLogout = () => {
      setUserRole(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  // Memoize router configuration to prevent unnecessary recreations unless userRole changes
  const router = useMemo(() => {
    return createBrowserRouter([
      {
        path: '/',
        element: <Layout userRole={userRole} />,
        errorElement: <NotFound />,
        children: [
          {
            index: true,
            element: <HomePage />
          },
          {
            path: 'profile',
            element: (
              <ProtectedRoute userRole={userRole}>
                <ProfilePage />
              </ProtectedRoute>
            )
          },
          // Guest Protected Routes
          {
            path: 'find-host',
            element: (
              <ProtectedRoute allowedRoles={['guest']} userRole={userRole}>
                <FindHost />
              </ProtectedRoute>
            )
          },
          {
            path: 'my-requests',
            element: (
              <ProtectedRoute allowedRoles={['guest']} userRole={userRole}>
                <MyRequests />
              </ProtectedRoute>
            )
          },
          // Host Protected Routes
          {
            path: 'requests-board',
            element: (
              <ProtectedRoute allowedRoles={['host']} userRole={userRole}>
                <RequestsBoard />
              </ProtectedRoute>
            )
          },
          // Admin Protected Routes
          {
            path: 'admin',
            element: (
              <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
                <AdminLayout />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'users', element: <AdminUsers /> },
              { path: 'bookings', element: <AdminBookings /> },
              { path: 'listings', element: <AdminListings /> }
            ]
          }
        ]
      },
      {
        path: '/login',
        element: userRole ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
      },
      {
        path: '/signup',
        element: userRole ? <Navigate to="/" replace /> : <Signup />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]);
  }, [userRole]);

  return { router };
}
