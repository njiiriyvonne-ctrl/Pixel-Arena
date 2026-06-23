import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/login'
import Register from './pages/Register'
import Lobby from './pages/Lobby'
import Live from './pages/Live'
import Wallet from './pages/Wallet'
import Leaderboard from './pages/Leaderboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color: 'var(--text2)', padding: '2rem', textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/lobby" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/lobby" /> : <Register />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}