import { useState } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './components/Common/Layout/Layout'

import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import HomePage from './pages/Home/Home'
import FindHost from './pages/FindHost/FindHost'
import MyRequests from './pages/MyRequests/MyRequests'
import RequestsBoard from './pages/RequestsBoard/RequestsBoard'
import ProfilePage from './pages/Profile/Profile'
import NotFound from './pages/NotFound/NotFound'

export default function App() {
  // Control authorization state ('guest', 'host', or null)
  const [userRole, setUserRole] = useState(null) 

  const router = createBrowserRouter([
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
          element: <ProfilePage />
        },
        // Guest Protected Routes
        {
          path: 'find-host',
          element: userRole === 'guest' ? <FindHost /> : <Navigate to="/" replace />
        },
        {
          path: 'my-requests',
          element: userRole === 'guest' ? <MyRequests /> : <Navigate to="/" replace />
        },
        // Host Protected Routes
        {
          path: 'requests-board',
          element: userRole === 'host' ? <RequestsBoard /> : <Navigate to="/" replace />
        }
      ]
    },
    {
      path: '/login',
      element: userRole ? <Navigate to="/" replace /> : <Login />
    },
    {
      path: '/signup',
      element: userRole ? <Navigate to="/" replace /> : <Signup />
    },
    {
      path: '*',
      element: <NotFound />
    }
  ])

  return <RouterProvider router={router} />
}