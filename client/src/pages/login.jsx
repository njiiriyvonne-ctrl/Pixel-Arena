import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,92,255,0.12) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'monospace', fontSize: '1.8rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #7C5CFF, #00FFB3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>PIXELARENA</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Welcome back. Enter the arena.
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {error && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : '🎮 Login'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text2)' }}>
            No account? <Link to="/register" style={{ color: 'var(--accent)' }}>Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  )
}