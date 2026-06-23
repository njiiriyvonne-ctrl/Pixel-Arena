import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Navbar() {
  const { user, logout, token, API } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (token) {
      axios.get(`${API}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setBalance(res.data.balance || 0)).catch(() => {})
    }
  }, [token, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '64px'
    }}>
      <Link to="/" style={{
        fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700,
        background: 'linear-gradient(135deg, #7C5CFF, #00FFB3)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        PIXEL<span style={{ WebkitTextFillColor: 'var(--neon)' }}>ARENA</span>
      </Link>

      {user && (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            { path: '/lobby', label: 'Lobby' },
            { path: '/live', label: '🔴 Live' },
            { path: '/leaderboard', label: 'Rankings' },
            { path: '/wallet', label: 'Wallet' },
          ].map(({ path, label }) => (
            <Link key={path} to={path} style={{
              padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem', fontWeight: 500,
              color: isActive(path) ? 'var(--accent)' : 'var(--text2)',
              background: isActive(path) ? 'var(--bg3)' : 'transparent',
              transition: 'all 0.2s'
            }}>{label}</Link>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: '100px', padding: '0.35rem 0.85rem',
              fontSize: '0.85rem', fontWeight: 500
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon)' }} />
              KES {balance.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              👤 {user.username}
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}