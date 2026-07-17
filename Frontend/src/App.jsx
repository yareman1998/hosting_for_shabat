import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar'

export default function App() {
  const [todos, setTodos] = useState([])
  
  // 1. Initialize userRole as null (it will be set once we fetch it from the backend)
  const [userRole, setUserRole] = useState(null) 
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initApp() {
      try {
        // 2. Fetch the todos (your existing backend call)
        const todosResponse = await axios.get('http://localhost:8000/todos')
        if (todosResponse.data) {
          setTodos(todosResponse.data)
        }

        // 3. Fetch the logged-in user's profile/role from your FastAPI backend
        // Note: If you are using JWT tokens, you would pass it in the headers like this:
        // const token = localStorage.getItem('token')
        const profileResponse = await axios.get('http://localhost:8000/api/user/profile', {
          // headers: { Authorization: `Bearer ${token}` }
        })
        
        if (profileResponse.data && profileResponse.data.role) {
          setUserRole(profileResponse.data.role) // Sets 'host' or 'guest'
        }
      } catch (error) {
        console.error("Error initializing app data:", error)
      } finally {
        setLoading(false) // Stop showing loading screen once calls are done
      }
    }

    initApp()
  }, [])

  // 4. Show a clean loading state while fetching the user's role
  if (loading) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading...</div>
  }

  return (
    <div>
      {/* 5. The Navbar component now uses the real role fetched from your database */}
      <Navbar userRole={userRole} />

      {/* Your existing list */}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </div>
  )
}