import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { authApi } from '../api/api'
import Layout from '../components/Common/Layout/Layout'
import HomePage from '../pages/Home/Home'
import FindHost from '../pages/FindHost/FindHost'
import HostDetails from '../pages/HostDetails/HostDetails'
import MyRequests from '../pages/MyRequests/MyRequests'
import RequestsBoard from '../pages/RequestsBoard/RequestsBoard'
import ProfilePage from '../pages/Profile/Profile'
import NotFound from '../pages/NotFound/NotFound'

// Auth Views
import Login from '../pages/Login/Login'
import Register from '../pages/Register/Register'

// Admin Views
import AdminLayout from '../pages/Admin/Admin'
import AdminDashboard from '../components/Admin/AdminDashboard'
import AdminUsers from '../components/Admin/AdminUsers'
import AdminBookings from '../components/Admin/AdminBookings'
import AdminListings from '../components/Admin/AdminListings'


import ProtectedRoute from '../components/Common/ProtectedRoute'
import Loading from '../components/Common/Loading/Loading'

export function useAppLogic() {
  const [userRole, setUserRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Fetch current user from server using JWT token
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUserRole(null);
      setLoadingAuth(false);
      return;
    }
    setLoadingAuth(true);
    try {
      const response = await authApi.getMe();
      const userData = response.data;
      setUserRole(userData.user_type);
    } catch (error) {
      console.error("Failed to authenticate user token:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUserRole(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleLogout = () => {
      setUserRole(null);
      setLoadingAuth(false);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  // Updates hook state immediately when a user logs in successfully
  const handleLoginSuccess = async () => {
    await refreshUser();
  };

  // Memoize router configuration to prevent unnecessary recreations unless userRole or loadingAuth changes
  const router = useMemo(() => {
    return createBrowserRouter([
      {
        path: '/',
        element: <Layout userRole={userRole} loading={loadingAuth} />,
        errorElement: <NotFound />,
        children: [
          {
            index: true,
            element: userRole === 'admin' ? <Navigate to="/admin" replace /> : <HomePage />
          },
          {
            path: 'profile',
            element: (
              <ProtectedRoute userRole={userRole} loading={loadingAuth}>
                <ProfilePage />
              </ProtectedRoute>
            )
          },
          // Guest Protected Routes
          {
            path: 'find-host',
            element: (
              <ProtectedRoute allowedRoles={['guest']} userRole={userRole} loading={loadingAuth}>
                <FindHost />
              </ProtectedRoute>
            )
          },
          {
            path: 'find-host/:id',
            element: (
              <ProtectedRoute allowedRoles={['guest']} userRole={userRole} loading={loadingAuth}>
                <HostDetails />
              </ProtectedRoute>
            )
          },
          {
            path: 'host/:id',
            element: (
              <ProtectedRoute allowedRoles={['guest']} userRole={userRole} loading={loadingAuth}>
                <HostDetails />
              </ProtectedRoute>
            )
          },
          {
            path: 'my-requests',
            element: (
              <ProtectedRoute allowedRoles={['guest']} userRole={userRole} loading={loadingAuth}>
                <MyRequests />
              </ProtectedRoute>
            )
          },
          // Host Protected Routes
          {
            path: 'requests-board',
            element: (
              <ProtectedRoute allowedRoles={['host']} userRole={userRole} loading={loadingAuth}>
                <RequestsBoard />
              </ProtectedRoute>
            )
          },
          // Admin Protected Routes
          {
            path: 'admin',
            element: (
              <ProtectedRoute allowedRoles={['admin']} userRole={userRole} loading={loadingAuth}>
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
        element: loadingAuth ? (
          <Loading />
        ) : userRole ? (
          <Navigate to="/" replace />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )
      },
      {
        path: '/register',
        element: loadingAuth ? (
          <Loading />
        ) : userRole ? (
          <Navigate to="/" replace />
        ) : (
          <Register />
        )
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]);
  }, [userRole, loadingAuth]);

  return { router };
}