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
        fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900,
        background: 'linear-gradient(135deg, #0066FF, #00D9FF)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: '0.05em'
      }}>
        PIXEL<span style={{ WebkitTextFillColor: 'var(--gold)' }}>ARENA</span>
      </Link>

      {user && (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            { path: '/lobby', label: '🎮 Lobby' },
            { path: '/live', label: '🔴 Live' },
            { path: '/leaderboard', label: '🏆 Rankings' },
            { path: '/wallet', label: '💰 Wallet' },
          ].map(({ path, label }) => (
            <Link key={path} to={path} style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem', fontWeight: 600,
              color: isActive(path) ? 'var(--cyan)' : 'var(--text2)',
              background: isActive(path) ? 'rgba(0,217,255,0.1)' : 'transparent',
              border: isActive(path) ? '1px solid rgba(0,217,255,0.3)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}>{label}</Link>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(46,204,113,0.08))',
              border: '1px solid rgba(46,204,113,0.3)',
              borderRadius: '100px', padding: '0.5rem 1rem',
              fontSize: '0.85rem', fontWeight: 700,
              color: 'var(--success)'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
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