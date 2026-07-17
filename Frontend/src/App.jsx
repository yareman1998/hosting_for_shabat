import { useState } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './components/Common/Layout'
import Login from './pages/Login/Login'

// Placeholder page components (Swap these out later for your real pages!)
const HomePage = () => <div><h1>דף הבית - ברוכים הבאים!</h1></div>;
const FindHost = () => <div><h1>מצא מארח לשבת</h1></div>;
const MyRequests = () => <div><h1>לוח הבקשות שלי</h1></div>;
const RequestsBoard = () => <div><h1>לוח בקשות אירוח לחיילים</h1></div>;
const ProfilePage = () => <div><h1>הפרופיל שלי</h1></div>;
const NotFound = () => <div><h1>העמוד לא נמצא (404)</h1></div>;

export default function App() {
  // Control authorization state ('guest', 'host', or null)
  const [userRole, setUserRole] = useState('guest') 

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
      path: '*',
      element: <NotFound />
    }
  ])

  return <RouterProvider router={router} />
}